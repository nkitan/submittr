const logger = require('logplease').create('api');
const express = require('express');
const router = express.Router();

const config = require('../src/config');
const runtime = require('../src/runtime');
const Job = require('../src/jobs');
const package = require('../src/package');

router.use((req, res, next) => {
    if(['GET', 'HEAD', 'OPTIONS'].includes(req.method)){
        return next();
    }

    if(!req.headers['content-type'].startsWith('application/json')) {
        return res.status(415).send({
            message: 'invalid request type',
        });
    }

    next();
})

router.post('/execute', async (req, res) => {
    logger.info('REQUEST TO EXECUTE RECEIVED');
    const {
        language,
        version,
        files,
        stdin,
        args,
        runTimeout,
        compileTimeout,
        compileMemoryLimit,
        runtimeMemoryLimit,
    } = req.body;

    if(!username || typeof username !== 'string'){
        return res.status(420).send({
            message: 'username must be provided as a string'
        })
    }

    if(!token || typeof token !== 'string'){
        return res.status(420).send({
            message: 'token must be provided as a string'
        })
    }

    if(!language || typeof language !== 'string'){
        return res.status(420).send({
            message: 'language is required to be a string',
        });
    }

    if (!version || typeof version !== 'string') {
        return res.status(420).send({
            message: 'version is required to be a string',
        });
    }

    if (!files || !Array.isArray(files)) {
        return res.status(420).send({
            message: 'files is required to be an array',
        });
    }

    for (const [i, file] of files.entries()) {
        if (typeof file.content !== 'string') {
            return res.status(420).send({
                message: `file[${i}]: content is required as a string`,
            });
        }
    }

    if(compileMemoryLimit){
        if(typeof compileMemoryLimit !== 'number'){
            return res.status(410).send({
                message: 'compiled memory limit must be a number',
            });
        }

        if(config.compileMemoryLimit >= 0 && (compileMemoryLimit > config.compileMemoryLimit || compileMemoryLimit < 0)){
            return res.status(410).send({
                message: 'compile memory limit cannot be greater than configured limit of ' + config.compileMemoryLimit,
            });
        }
    }

    if(runtimeMemoryLimit){
        if(typeof runtimeMemoryLimit !== 'number'){
            return res.status(410).send({
                message: 'run memory limit must be a number',
            });
        }

        if(config.runtimeMemoryLimit >= 0 && (runtimeMemoryLimit > config.runtimeMemoryLimit || runtimeMemoryLimit < 0)){
            return res.status(410).send({
                message: 'run memory limit cannot be greater than configured limit of ' + config.runtimeMemoryLimit,
            });
        }
    }
    
    const runTime = runtime.getLatestRuntimeMatchingLanguageVersion(language,version);

    if(runTime === undefined){
        return res.status(400).send({
            message: `${language}: ${version} RUNTIME IS UNSUPPORTED`,
        })
    } 

    const job = new Job({
        runtime: runTime,
        alias: language,
        files: files,
        args: args || [],
        stdin: stdin || '',
        
        timeouts: {
            run: runTimeout || 3000,
            compile: compileTimeout || 10000,
        },

        memoryLimits: {
            run: runtimeMemoryLimit || config.runtimeMemoryLimit,
            compile: compileMemoryLimit || config.compileMemoryLimit,
        },
    });

    await job.prime();
    const result = await job.execute();

    await job.cleanup();

    return res.status(200).send(result);
})

router.get('/runtimes', (req, res) => {
    const runtimes = runtime.map(runTime => {
        return {
            language: runTime.language,
            version: runTime.version.raw,
            aliases: runTime.aliases,
            runtime: runTime.runtime,
        };
    });

    return res.status(200).send(runtimes);
})

router.get('/packages', async (req, res) => {
    logger.debug('REQUEST TO LIST PACKAGES RECEIVED');
    let packages = await package.getPackageList();

    packages = packages.map(package => {
        return {
            language: package.language,
            version: package.version.raw,
            installed: package.installed,
        };
    });

    return res.status(200).send(packages);
});

router.post('/packages', async (req, res) => {
    logger.debug('REQUEST TO INSTALL PACKAGE RECEIVED');

    const { language, version } = req.body;
    const Package = await package.getPackage(language, version);

    if(Package == null){
        return res.status(404).send({
            message: `PACKAGE ${language}: ${version} NOT FOUND!`,
        });
    }

    try {
        const response = await Package.install();
        return res.status(200).send(response);
    } catch (error){
        logger.error(`ERROR WHILE INSTALLING ${Package.language}: ${Package.version}: ${error.message}`)
        
        return res.status(500).send({
            message: error.message,
        })
    }
});
 
router.delete('./packages', async (req, res) => {
    logger.debug('REQUEST TO UNINSTALL PACKAGE RECEIVED');

    const { language, version } = req.body;
    const Package = await package.getPackage(language, version);

    if(Package == null){
        return res.status(400).send({
            message: `PACKAGE ${language}: ${version} IS NOT INSTALLED`,
        });
    }

    try {
        const response = await Package.uninstall();
        return res.status(200).send(response);
    } catch(error){
        logger.error(`ERROR WHILE UNINSTALLING PACKAGE ${language}: ${version} : ${error.message}`);

        return res.status(500).send({
            message: error.message,
        });
    }
});

module.exports = router;