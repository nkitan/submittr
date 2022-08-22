const logger = require('logplease').create('package');
const semver = require('semver');
const filesystem = require('fs');
const fspromises = require('fs/promises');
const fetch = require('node-fetch');
const crypto = require('crypto');
const childprocess = require('child_process');
const path = require('path');
const chownr = require('chownr');
const util = require('util');

const runtime = require('./runtime');
const config = require('./config');
const globals = require('./globals');
const { stdout } = require('process');

class Package {
    constructor({ language, version, download, checksum }){
        this.language = language;
        this.version = semver.parse(version);
        this.checksum = checksum;
        this.download = download;
    }

    get installed(){
        return filesystem.existsSync(path.join(this.installPath, globals.installedPackages));
    }

    get installPath(){
        return path.join(config.dataDirectory, globals.dataDirectories.packages, this.language, this.version.raw);
    }

    async install(force){
        if(this.installed && !force){
            logger.info('registering runtime at ' + this.installPath);
            runtime.load(this.installPath);
            throw new Error('already installed');
        }

        logger.info(`installing ${this.language}: ${this.version.raw}`);

        // check if path exists
        if(filesystem.existsSync(this.installPath)){
            logger.warn(`${this.language}: ${this.version.raw} has residual files`);
            await fspromises.rm(this.installPath, {recursive: true, force: true});
        }

        logger.info(`creating directory ${this.installPath}`);
        await fspromises.mkdir(this.installPath, {recursive: true });

        logger.info(`downloading package from ${this.download} into ${this.installPath}`);

        // download package into fileStream at pkgpath
        const pkgpath = path.join(this.installPath, 'pkg.tar.gz');
        const download = await fetch(this.download);

        const fileStream = filesystem.createWriteStream(pkgpath);
        await new Promise((resolve, reject) => {
            download.body.pipe(fileStream);
            download.body.on('error', reject);

            fileStream.on('finish', resolve);
        });

        logger.info('validating checksum');
        const checksum = crypto.createHash('sha256')
            .update(filesystem.readFileSync(pkgpath))
            .digest('hex');

        logger.info(`sha256(${this.language} : ${this.checksum}`);    
        logger.info(`sha256(pkg.tar.gz : ${checksum}`);
        if(checksum !== this.checksum){
            throw new Error(`checksum error: ${this.checksum} != ${checksum}`);
        }    

        logger.info(`extracting from ${pkgpath} to ${this.installPath}`);
        
        // extract gz
        await new Promise((resolve, reject) => {
            const proc = childprocess.exec(`bash -c 'cd "${this.installPath}" && tar xzf pkg.tar.gz'`);
            
            proc.once('exit', (code, _) => {
                code === 0 ? resolve() : reject();
            });

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.once('error', reject);
        });


        logger.info('registering runtime at ' + this.installPath);
        runtime.load(this.installPath);

        logger.info('caching environment');
        const getEnv = `cd ${this.installPath}; source environment; env`
        const envOut = await new Promise((resolve, reject) => {
            let stdout = '';

            const proc = childprocess.spawn(
                'env',
                ['-i', 'bash', '-c', `${getEnv}`],
                {
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            );

            proc.once('exit', (code, _) => {
                code === 0 ? resolve(stdout) : reject();
            })

            proc.stdout.on('data' , data => {
                stdout += data;
            })
            
            proc.once('error', reject);
        });

        const filteredEnv = envOut.split('\n').filter(
            line => !['PWD', 'OLDPWD', '_', 'SHLVL'].includes(
                line.split('=', 2)[0]
            )
        ).join('\n');
        
        
        await fspromises.writeFile(path.join(this.installPath, '.env'), filteredEnv);
        
        logger.info('changing ownership of package path');
        await util.promisify(chownr)(this.installPath, 0, 0);
 
        logger.info('deleting residual file ' + pkgpath)
        await fspromises.rm(pkgpath);
        
        logger.debug('writing installed state to disk');
        await fspromises.writeFile(path.join(this.installPath, globals.installedPackages),Date.now().toString());

        logger.info(`installed package ${this.language}: ${this.version.raw}`)
        return {
            language: this.language,
            version: this.version.raw,
        };
    }       

    async uninstall(){
        logger.info(`uninstalling ${this.language}: ${this.version.raw}`);
        logger.info('finding runtime');

        const found = runtime.getRuntimeByNameAndVersion(this.language,this.version.raw);

        if(!found){
            logger.error(`uninstall failed! package not installed`);
            throw new Error(`${this.language}: ${this.version.raw} is not installed`);
        }

        logger.info('unregistering runtime');
        found.unregister();

        logger.info('cleaning files from disk');
        await fspromises.rmdir(this.installPath, { recursive: true });

        logger.info(`succesfully uninstalled ${this.language}: ${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw,
        };
    }

    static async getPackageList(){
        const contents = await fetch(config.repoURL).then(x => x.text());
        const entries = contents.split('\n').filter(x => x.length > 0);

        return entries.map(line => {
            const [language, version, checksum, download] = line.split(',',4);
            return new Package({
                language,
                version,
                checksum,
                download,
            });
        });
    }

    static async getPackage(language, version){
        const packages = await Package.getPackageList();

        // return candidates with language and version satisfied
        const candidates = packages.filter(pkg => {
            return ( pkg.language == language && semver.satisfies(pkg.version, version));
        });
        
        // sort candidate list
        candidates.sort((first, second) => semver.rcompare(first.version, second.version));
        
        // return prime candidate or null if no candidates
        return candidates[0] || null;
    }
}

module.exports = Package;