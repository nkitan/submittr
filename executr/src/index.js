#!/usr/bin/env node
const express = require('express');
const fspromises = require('fs/promises');
const path = require('path');
const filesystem = require('fs');
const runtime = require('./runtime');

const config = require('./config');
const globals = require('./globals');
const api = require('../api/apiv2');

const Logger = require('logplease');
Logger.setLogLevel(config.loglevel);
const logger = Logger.create('index');
const app = express();

(async () =>{
    logger.info("LOG LEVEL SET TO ", config.logLevel);
    logger.info("CHECKING DIRECTORIES");

    logger.info("ENSURING DATA DIRECTORIES EXIST");

    // check if all data subdirectories exist, if not, create new
    Object.values(globals.dataDirectories).forEach(subdirectory => {
        let dataPath = path.join(config.dataDirectory,subdirectory);

        logger.info(`ENSURING ${dataPath} exists`)

        if(!filesystem.existsSync(dataPath)){
            logger.info(`${dataPath} DOES NOT EXIST. CREATING NEW`);

            try{
                // create $data_path
                filesystem.mkdirSync(dataPath);
            } catch (error){
                logger.error(`FAILED TO CREATE ${dataPath}: `, error.message);
            }
        }
    });

    logger.info('LOADING PACKAGES');

    const packagesPath = path.join(config.dataDirectory, globals.dataDirectories.packages);
    const pkgList = await fspromises.readdir(packagesPath);
    const languages = await Promise.all(pkgList.map(language => {
            return fspromises.readdir(path.join(packagesPath, language))
            .then(x => {
                return x.map(y => path.join(packagesPath, language, y));
            });
    }))

    const installedLanguages = languages.flat().filter(package =>{
        filesystem.existsSync(path.join(package, globals.installedPackages));
    });


    installedLanguages.forEach(package => runtime.load(package));

    logger.info('STARTING API SERVER');
    logger.info('STARTING EXPRESS APP');
    logger.info('REGISTERING MIDDLEWARE');

    app.use(express.urlencoded({extended: true}));
    app.use(express.json())

    app.use((err, req, res, next) => {
        return res.status(400).send({
            stack: err.stack,
        });
    });

    logger.info('REGISTERING ROUTES');

    app.use('/exec',api);

    // handle invalid page redirects
    app.use((req, res, next) => {
        return res.status(404).json({
            message: "not found!"
        });
    });

    logger.info('CALLING APP LISTENER');

    // get address and port from config and start listening
    const [ address, port ] = config.bindAddress.split(':');

    app.listen(port, address, () => {
        logger.info('executr running @', config.bindAddress);
    });
})();
