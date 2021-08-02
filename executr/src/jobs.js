const logger = require('logplease').create('job');
const {v4: uuidv4 } = require('uuid');
const childprocess = require('child_process');
const path = require('path');
const filesystem = require('fs/promises');
const fs = require('fs');
const waitPID = require('waitpid');


const config = require('./config');
const globals = require('./globals');
const { error } = require('console');
const { resolve } = require('url');

const jobStates = {
    READY: Symbol('READY TO BE PRIMED'),
    PRIMED: Symbol('PRIMED AND READY FOR EXECUTION'),
    EXECUTED: Symbol('EXECUTED AND READY FOR CLEANUP'),
};

let UID = 0;
let GID = 0;

class Job {
    constructor({ runtime, files, args, stdin, timeouts, memoryLimits }){
        this.uuid = uuidv4();   // generate a random uuid
        this.runtime = runtime;
        this.files = files.map((file, i) => ({
            name: file.name || `file${i}.code`,
            content: file.content,
        }));

        this.args = args;
        this.stdin = stdin;
        this.timeouts = timeouts;
        this.memoryLimits = memoryLimits;

        this.UID = config.runnerMinUID + UID;
        this.GID = config.runnerMinGID + GID;

        // assign new UID, GID to each job by incrementing it
        UID++;
        GID++;

        UID %= config.runnerMaxUID - config.runnerMinUID + 1;
        GID %= config.runnerMaxGID - config.runnerMinGID + 1;

        this.state = jobStates.READY;
        this.directory = path.join(config.dataDirectory, globals.dataDirectories.jobs, this.uuid);
    }

    async prime(){
        const downloadFile = async function(url, filePath) {
            return new Promise((resolve, reject) => {
                const fileStream = fs.createWriteStream(filePath);
                const curl = childprocess.spawn('curl', [url]);

                curl.stdout.on('data', (data) => { 
                    fileStream.write(data); 
                });

                curl.stdout.on('end', (data) =>  {
                    fileStream.end();
                    logger.info('downloaded ' + filePath);
                    resolve();
                });
    
                curl.on('exit', (code) =>  {
                    if (code != 0) {
                        logger.error('download failed -' + code);
                        reject();
                    }
                
                    resolve()
                });
            })
        };

        logger.info(`priming job ${this.uuid}`);
        // set permission of directory to 700 - USER READ, WRITE, EXECUTE
        await filesystem.mkdir(this.directory, { mode: 0o700 });
        
        // own the current directory
        logger.info(`transferring ownership to uid: ${this.UID} gid: ${this.GID} directory: ${this.directory}"`);
        await filesystem.chown(this.directory, this.UID, this.GID);
        
        for (const file of this.files){
            let filePath = path.join(this.directory, file.name);
                await downloadFile(file.content, filePath)
                await filesystem.chown(filePath, this.UID, this.GID);
            }
        
        this.state = jobStates.PRIMED;
        logger.info(`job ${this.uuid} primed`);
    }

    // function to run code safely using prlimit
    async safeCall(file, args, timeout, memoryLimit){        
        return new Promise((resolve, reject) => {
            const noNetwork = config.disableNetworking ? ['nosocket'] : []
            const processLimit = [
                'prlimit',
                '--nproc=' + config.maxProcessCount,
                '--nofile=' + config.maxOpenFiles,
                '--fsize=' + config.maxFileSize,
            ];

            // set memory limit if applicable
            if(memoryLimit >= 0){
                processLimit.push('-as=' + memoryLimit);
            }

            const processCall = [...processLimit, ...noNetwork, 'bash', file, ...args];
            var stdout = '';
            var stderr = '';
            var output = '';
            
            // TODO- fix permission error
            const proc = childprocess.spawn(processCall[0], processCall.splice(1), {
                env: {
                    ...this.runtime.environmentVariables,
                    EXECUTR_LANGUAGE: this.runtime.language,
                },
                stdio: 'pipe',
                cwd: this.directory,
                uid: this.UID,
                gid: this.GID,
                detached: true,
            });

            
            proc.stdin.write(this.stdin);
            proc.stdin.end();
            proc.stdin.destroy();

            const killTimeout = setTimeout( _ => proc.kill('SIGKILL'), timeout);
            proc.stderr.on('data', data => {
                if(stderr.length > config.maxOutputSize){
                    proc.kill('SIGKILL');
                } else {
                    stderr += data;
                    output += data;
                }
            });

            proc.stdout.on('data', data => {
                if(stdout.length > config.maxOutputSize){
                    proc.kill('SIGKILL');
                } else {
                    stdout += data;
                    output += data;
                }
            });

            const cleanup = () => {
                clearTimeout(killTimeout);

                proc.stderr.destroy();
                proc.stdout.destroy();
            };

            proc.on('exit', (code, signal) => {
                cleanup();
                resolve({ stdout, stderr, code, signal, output });
            })

            proc.on('error', (err) => {
                cleanup();
                reject({ error: err, stdout, stderr, output });
            });
        });
    }

    async execute(){
        if(this.state !== jobStates.PRIMED) {
            throw new Error('job must be primed before execution, current state is ' + this.state.toString());
        }

        logger.info(`executing job : ${this.uuid} uid: ${this.UID} gid: ${this.GID} on runtime: ${this.runtime.toString()}`);
        
        let compile;
        if(this.runtime.compiled){
            logger.info('compiling')
            compile = await this.safeCall(path.join(this.runtime.pkgdir, 'compile'),
                this.files.map(x => x.name),
                this.timeouts.compile,
                this.memoryLimits.compile
            );
        }

        logger.info('running')
        const run = await this.safeCall(path.join(this.runtime.pkgdir, 'run'),
            [this.files[0].name, ...this.args],
            this.timeouts.run,
            this.memoryLimits.run
        );

        this.state = jobStates.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version.raw,
        }
    }

    async cleanupProcesses(){
        let processes = Promise.resolve([1]);

        while(processes.length > 0){
            processes = await new Promise((resolve, reject) => 
                childprocess.execFile('ps', ['awwxo', 'pid,ruid'], (err, stdout) => {
                    if(err === null){
                        const lines = stdout.split('\n').slice(1);
                        const procs = lines.map(line => {
                            const [pid, ruid] = line.trim().split(/\s+/).map(n => parseInt(n));
                            return { pid, ruid };
                        });

                        resolve(procs);
                    } else {
                        reject(error);
                    }
                })
            );

            processes = processes.filter(proc => proc.ruid === this.UID);
        
            for(const proc of processes){
                try {
                    process.kill(proc.PID, 'SIGSTOP');
                } catch(err) {
                    logger.error('could not stop process: ' + err)
                }
            }

            for (const proc of processes){
                try {
                    process.kill(proc.PID, 'SIGKILL');
                } catch(err) {
                    logger.error('could not kill process: ' + err)
                }

                waitPID(proc.PID);
            }
        }   
    }

    async cleanupFileSystem(){
        for(const cleanupPath of globals.cleanupDirectories){
            const contents = await filesystem.readdir(cleanupPath);

            for(const file of contents){
                const filePath = path.join(cleanupPath, file);

                try {
                    const stat = await filesystem.stat(filePath);

                    if(stat.UID === this.UID){
                        await filesystem.rm(filePath, {
                            recursive: true,
                            force: true,
                        });
                    } 
                    } catch (error) {
                        logger.warn(`error removing file ${filePath}: ${error}`);
                }
            }
        }

        await filesystem.rm(this.directory, {recursive: true, force: true});
    }

    async cleanup(){
        logger.info(`cleaning job ${this.uuid}`);

        await Promise.all([
            this.cleanupProcesses(),
            this.cleanupFileSystem(),
        ]);
    }
}

module.exports = Job;
