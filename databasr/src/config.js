const logger = require('logplease').create('config');
const filesystem = require('fs');
const path = require('path');

const options = [
    {
        key: 'dataDirectory',
        description: 'PATH TO STORE ASSIGNMENT DATA',
        default: '/databasr_data',
        validators: [ x => filesystem.existsSync(x) || `DIRECTORY ${x} DOES NOT EXIST`],
    },
]


logger.info('LOADING CONFIGURATION');
let failed = false;

let config = {};
let dataDirectories = {
    assignments: 'assignments',
    submissions: 'submissions'
}

options.forEach(option => {
    const environmentKey = 'DATABASR_' + option.key.toUpperCase();
    const environmentValue = process.env[environmentKey];
    const value = environmentValue || option.default;

    option.validators.forEach(validator => {
        let response = validator(value, value);
        
        if(response !== true){
            failed = true;
            logger.error(`CONFIG OPTION ${option.key} FAILED VALIDATION: `, response);
            return;
        }
    });

    config[option.key] = value;
});

if(failed){
    process.exit(1);
}

logger.info("ENSURING DATA DIRECTORIES EXIST");
Object.values(dataDirectories).forEach(subdirectory => {
    let dataPath = path.join(config.dataDirectory, subdirectory);
    logger.info(`ENSURING ${dataPath} exists`)

    if(!filesystem.existsSync(dataPath)){
        logger.info(`${dataPath} DOES NOT EXIST. CREATING NEW`);

        try{
            filesystem.mkdirSync(dataPath);
        } catch (error){
            logger.error(`FAILED TO CREATE ${dataPath}: `, error.message);
        }
    }
});


logger.info('CONFIGURATION LOADED SUCCESSFULLY!');

module.exports = { config, dataDirectories };
