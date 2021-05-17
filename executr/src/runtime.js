const logger = require('logplease').create('runtime');
const semver = require('semver');
const filesystem = require('fs');
const path = require('path');

const globals = require('./globals');
const config = require('./config');

const runtimes = [];

class Runtime {
    constructor({ language, version, aliases, pkgdir, runtime }) {
        this.language = language;
        this.version = version;
        this.aliases = aliases || [];
        this.pkgdir = pkgdir;
        this.runtime = runtime;
    }

    static load(packageDirectory){
        let info = JSON.parse(filesystem.readFileSync(path.join(packageDirectory, 'packageInfo.json')));

        let { language, version, buildPlatform, aliases, provides } = info;
        version = semver.parse(version);

        if(buildPlatform !== globals.platform){
            logger.warn(`PACKAGE ${language}: ${version} WAS BUILT FOR PLATFORM ${buildPlatform} BUT WE HAVE ${globals.platform}`);
        }

        if(provides){
            provides.forEach(language => {
                runtimes.push(
                    new Runtime({
                        language: language.language,
                        aliases: language.aliases,
                        version,
                        pkdir: packageDirectory,
                        runtime: language,
                    })
                );
            });
        } else {
            runtimes.push(
                new Runtime({
                    language,
                    version,
                    aliases,
                    pkgdir: packageDirectory,
                })
            );
        }

        logger.debug(`PACKAGE ${language}: ${version} WAS LOADED`);
    }

    get compiled(){
        if(this._compiled === undefined){
            this._compiled == filesystem.existsSync(path.join(this.pkgdir,'compile'));
        }

        return this._compiled;
    }

    get environmentVariables(){
        if(!this._environmentVariables){
            const environmentFile = path.join(this.pkgdir, '.env');
            const environment = filesystem.readFileSync(environmentFile).toString();

            this._environmentVariables = {};

            // load environment variables from .env file
            environment.trim().split('\n').map(line => line.split('=', 2)).forEach(([key, val]) => {
                this._environmentVariables[key.trim()] = val.trim();
            });

            return this._environmentVariables;
        }
    }

    toString () {
        return `${this.language}: ${this.version.raw}`;
    }

    unregister() {
        const index = runtimes.indexOf(this);
        runtimes.splice(index,1);
    }
}

module.exports = runtimes;
module.exports.Runtime = Runtime;

module.exports.getRuntimesMatchingLanguageVersion = function (language, version){
    return runtimes.filter( runtime => (runtime.language || runtime.aliases.includes(language)) && 
        semver.satisfies(rt.version, version)
    );
};

module.exports.getLatestRuntimeMatchingLanguageVersion = function (language, version) {
    return module.exports.getRuntimesMatchingLanguageVersion(language, version)
        .sort((a, b) => semver.rcompare(a.version, b.version))[0];
};

module.exports.getRuntimeByNameAndVersion = function (runtime, version) {
    return runtimes.find(runTime => (runTime.runtime === runtime || (runTime.runtime === undefined && runTime.language == runtime)) &&
        semver.satisfies(runTime.version, version)
    );
};

module.exports.load = Runtime.load;