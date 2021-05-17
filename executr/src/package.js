const logger = require('logplease').create('package');
const semver = require('semver');
const filesystem = require('fs');
const fspromises = require('fs/promises');
const fetch = require('node-fetch');
const crypto = require('crypto');
const chownr = require('chownr');
const util = require('util');
const childprocess = require('child_process');
const path = require('path');

const runtime = require('./runtime');
const config = require('./config');
const globals = require('./globals');

class Package {
    constructor({ language, version, download, checksum }){
        this.language = language;
        this.version = semver.parse(version);
        this.checksum = checksum;
        this.download = download;
    }

    get installed(){
        return filesystem.existsSync(path.join(this._installPath, globals.installedPackages));
    }

    get installPath(){
        return path.join(config.dataDirectory, globals.dataDirectories.packages,this.language, this.version.raw);
    }

    async install(){
        if(this.installed){
            throw new Error('ALREADY INSTALLED');
        }

        logger.info(`INSTALLING ${this.language}: ${this.version.raw}`);

        if(filesystem.existsSync(this.installPath)){
            logger.warn(`${this.language}: ${this.version.raw} HAS RESIDUAL FILES LEFT OVER`);

            await fspromises.rm(this.installPath, {recursive: true, force: true});
        }

        logger.debug(`MAKING DIRECTORY ${this.installPath}`);
        await fspromises.mkdir(this.installPath, {recursive: true });

        logger.debug(`DOWNLOADING PACKAGE FROM ${this.download} TO ${this.installPath}`);

        // download package into fileStream at pkgpath
        const pkgpath = path.join(this.installPath, 'pkg.tar.gz');
        const download = await fetch(this.download);

        const fileStream = filesystem.createWriteStream(pkgpath);
        await new Promise((resolve, reject) => {
            download.body.pipe(fileStream);
            download.body.on('error', reject);

            fileStream.on('finish', resolve);
        });

        logger.debug('VALIDATING CHECKSUM');
        logger.debug(`SHA256(pkg.tar.gz = ${this.checksum}`);

        const checksum = crypto.createHash('sha256')
            .update(filesystem.readFileSync(pkgpath))
            .digest('hex');

        if(checksum !== this.checksum){
            throw new Error(`CHECKSUM CHECK FAILED ${this.checksum} != ${checksum}`);
        }    

        logger.debug(`EXTRACTING PACKAGE FROM ${pkgpath} TO ${this.installPath}`);
        
        // extract gz
        await new Promise((resolve, reject) => {
            const proc = childprocess.exec(`bash -c 'cd "${this.installPath}" && tar xzf ${pkgpath}`);
            
            proc.once('exit', (code, _) => {
                code === 0 ? resolve() : reject();
            });

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.once('error', reject);
        });

        logger.debug('REGISTERING RUNTIME');
        runtime.load(this.installPath);

        logger.debug('CACHING');
        const getEnv = `cd ${this.installPath}; source environment; env`;
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
        
        logger.debug('WRITING INSTALLED STATE TO DISK');
        await fspromises.writeFile(path.join(this.installPath, globals.installedPackages),Date.now().toString());
                
        return {
            language: this.language,
            version: this.version.raw,
        };
    }       

    async uninstall(){
        logger.info(`UNINSTALLING ${this.language}: ${this.version.raw}`);
        logger.debug('FINDING RUNTIME');

        const found = runtime.getRuntimeByNameAndVersion(this.language,this.version.raw);

        if(!found){
            logger.error(`UININSTALL FAILED! NOT INSTALLED`);
            
            throw new Error(`${this.language}: ${this.version.raw} IS NOT INSTALLED`);
        }

        logger.debug('UNREGISTERING RUNTIME');
        found.unregister();

        logger.debug('CLEANING FILES FROM DISK');
        await fspromises.rmdir(this.installPath, { recursive: true });

        logger.info(`UNINSTALLED ${this.language}: ${this.version.raw}`);

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