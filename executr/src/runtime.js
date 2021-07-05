const logger = require('logplease').create('runtime');
const semver = require('semver');
const filesystem = require('fs');
const path = require('path');

const globals = require('./globals');
const config = require('./config');

const runtimesArray = [];

class Runtime {
    constructor({ language, version, aliases, pkgdir, runtime }) {
        this.language = language;
        this.version = version;
        this.aliases = aliases || [];
        this.pkgdir = pkgdir;
        this.runtime = runtime;
    }

    static load(packageDirectory){
        let info = JSON.parse(filesystem.readFileSync(path.join(packageDirectory, 'pkg-info.json')));
        let { language, version, buildPlatform, aliases, provides } = info;
        version = semver.parse(version);

        if(buildPlatform !== globals.platform){
            logger.warn(`package ${language}: ${version} was built for platform ${buildPlatform} but we have ${globals.platform}`);
        }

        if(provides){
            provides.forEach(language => {
                runtimesArray.push(
                    new Runtime({
                        language: language.language,
                        aliases: language.aliases,
                        version,
                        pkgdir: packageDirectory,
                        runtime: language,
                    })
                );
            });
        } else {
            runtimesArray.push(
                new Runtime({
                    language,
                    version,
                    aliases,
                    pkgdir: packageDirectory,
                })
            );
        }

        logger.info(`package ${language}: ${version} loaded from ${packageDirectory}`);
    }

    get compiled(){
        if(this._compiled === undefined){
            this._compiled = filesystem.existsSync(path.join(this.pkgdir, 'compile'));
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
        const index = runtimesArray.indexOf(this);
        runtimesArray.splice(index,1);
    }
}

module.exports = runtimesArray;
module.exports.Runtime = Runtime;

module.exports.getRuntimesMatchingLanguageVersion = function (language, version){
    return runtimesArray.filter( runtime => (runtime.language == language || runtime.aliases.includes(language)) && 
        semver.satisfies(runtime.version, version)
    );
};

module.exports.getLatestRuntimeMatchingLanguageVersion = function (language, version) {
    return module.exports.getRuntimesMatchingLanguageVersion(language, version)
        .sort((a, b) => semver.rcompare(a.version, b.version))[0];
};

module.exports.getRuntimeByNameAndVersion = function (runtime, version) {
    return runtimesArray.find(runTime => (runTime.runtime === runtime || (runTime.runtime === undefined && runTime.language == runtime)) &&
        semver.satisfies(runTime.version, version)
    );
};

module.exports.load = Runtime.load;