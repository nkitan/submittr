const logger = require('logplease').create('api');
const express = require('express');
const router = express.Router();

const config = require('../src/config');
const runtime = require('../src/runtime');
const Job = require('../src/jobs');
const package = require('../src/package');

const verifyAdmin = require('../src/verifyAdmin')
const verifyTeacher = require('../src/verifyTeacher')

router.use((req, res, next) => {
    if(['GET', 'HEAD', 'OPTIONS'].includes(req.method)){
        return next();
    }

    if(!req.headers['content-type'].startsWith('application/json')) {
        return res.status(405).json({
            message: 'invalid request type',
        });
    }

    next();
})

//TODO - script to make nosocket available always
router.post('/execute', verifyTeacher, async (req, res) => {
    logger.info('request to execute recieved');
    try{
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
        
        if(!language || typeof language !== 'string'){
            return res.status(400).json({
                message: 'language is required to be a string',
            });
        }

        if (!version || typeof version !== 'string') {
            return res.status(400).json({
                message: 'version is required to be a string',
            });
        }

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({
                message: 'files is required to be an array',
            });
        }

        for (const [i, file] of files.entries()) {
            if (typeof file.content !== 'string') {
                return res.status(400).json({
                    message: `file[${i}]: content is required as a string`,
                });
            }
        }

        if(compileMemoryLimit){
            if(typeof compileMemoryLimit !== 'number'){
                return res.status(410).json({
                    message: 'compiled memory limit must be a number',
                });
            }

            if(config.compileMemoryLimit >= 0 && (compileMemoryLimit > config.compileMemoryLimit || compileMemoryLimit < 0)){
                return res.status(410).json({
                    message: 'compile memory limit cannot be greater than configured limit of ' + config.compileMemoryLimit,
                });
            }
        }

        if(runtimeMemoryLimit){
            if(typeof runtimeMemoryLimit !== 'number'){
                return res.status(410).json({
                    message: 'run memory limit must be a number',
                });
            }

            if(config.runtimeMemoryLimit >= 0 && (runtimeMemoryLimit > config.runtimeMemoryLimit || runtimeMemoryLimit < 0)){
                return res.status(410).json({
                    message: 'run memory limit cannot be greater than configured limit of ' + config.runtimeMemoryLimit,
                });
            }
        }

        const runTime = runtime.getLatestRuntimeMatchingLanguageVersion(language, version);
        
        if(runTime === undefined){
            return res.status(400).json({
                message: `${language}: ${version} runtime unsupported`,
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
        return res.status(200).json(result);

    } catch(error){
        logger.info(error)
        return res.status(400).json({
            message: 'invalid parameters'
        })
    }
})

router.get('/runtimes', verifyTeacher, (req, res) => {
    const runtimes = runtime.map(runTime => {
        return {
            language: runTime.language,
            version: runTime.version.raw,
            aliases: runTime.aliases,
            runtime: runTime.runtime,
        };
    });

    return res.status(200).json(runtimes);
})

router.get('/packages', verifyAdmin, async (req, res) => {
    logger.info('request to list packages recieved');
    let packages = await package.getPackageList();

    packages = packages.map(package => {
        return {
            language: package.language,
            version: package.version.raw,
            installed: package.installed,
        };
    });

    return res.status(200).json(packages);
});

router.post('/packages', verifyAdmin, verifyTeacher, async (req, res) => {
    const { language, version, force } = req.body;
    const Package = await package.getPackage(language, version);

    logger.info('request to install package ' + language + ':' + version + ' recieved');

    if(Package == null){
        logger.error(`package ${language}: ${version} not found!`)
        return res.status(404).json({
            message: `package ${language}: ${version} not found!`,
        });
    }

    try {
        const response = await Package.install(force);
        return res.status(200).json(response);
    } catch (error){
        logger.error(`error while installing ${Package.language}: ${Package.version}: ${error.message}`)
        
        return res.status(500).json({
            message: error.message,
        })
    }
});
 
router.delete('/packages', verifyAdmin, verifyTeacher, async (req, res) => {
    logger.info(`request to uninstall ${language}: ${version} recieved`);

    const { language, version } = req.body;
    const Package = await package.getPackage(language, version);

    if(Package == null){
        return res.status(410).json({
            message: `package ${language}: ${version} is not installed`,
        });
    }

    try {
        const response = await Package.uninstall();
        return res.status(200).json(response);
    } catch(error){
        logger.error(`error while uninstalling package ${language}: ${version} : ${error.message}`);

        return res.status(500).json({
            message: error.message,
        });
    }
});

module.exports = router;