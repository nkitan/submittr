const filesystem = require('fs');
require('dotenv').config();
const Logger = require('logplease')

const host = process.env.EXEC_HOST || 'localhost'
const port = process.env.EXEC_PORT || 6970


const options = [
    {
        key: 'logLevel',
        description: 'LEVEL OF DATA TO BE LOGGED',
        default: 'INFO',
        options: Object.values(Logger.LogLevels),
        validators: [ x => Object.values(Logger.LogLevels).includes(x) || `LOG LEVEL ${x} DOES NOT EXIST!`,],
    },

    {
        key: 'bindAddress',
        description: 'REST API ADDRESS',
        default: `${host}:${port}`,
        validators: [],
    },

    {
        key: 'dataDirectory',
        description: 'PATH TO STORE EXECUTR DATA',
        default: '/executr_data',
        validators: [ x => filesystem.existsSync(x) || `DIRECTORY ${x} DOES NOT EXIST`],
    },

    {
        key: 'runnerMinUID',
        description: 'MINIMUM UID FOR RUNNER',
        default: 1001,
        parser: parseInt,
        validators : [
            (x, raw) => !isNaN(x) || `${raw} IS INVALID!`,
        ],
    },

    {
        key: 'runnerMaxUID',
        description: 'MAXIMUM USER ID FOR RUNNER',
        default: 1500,
        parser: parseInt,
        validators : [
            (x, raw) => !isNaN(x) || `${raw} IS INVALID!`,
        ],
    },

    {
        key: 'runnerMinGID',
        description: 'MINIMUM GROUP ID FOR RUNNER',
        default: 1001,
        parser: parseInt,
        validators : [
            (x, raw) => !isNaN(x) || `${raw} IS INVALID!`,
        ],
    },

    {
        key: 'runnerMaxGID',
        description: 'MAXIMUM GROUP ID FOR RUNNER',
        default: 1500,
        validators : [
            (x, raw) => !isNaN(x) || `${raw} IS INVALID!`,
        ],
    },
    
    {
        key: 'disableNetworking',
        description: 'ENABLE/DISABLE NETWORKING',
        default: true,
        parser: x => x === 'true',
        validators: [x => typeof x === 'boolean' || `${x} IS INVALID!`],
    },

    {
        key: 'maxOutputSize',
        description: 'SPECIFY MAX SIZE OF STDIO BUFFER',
        default: 1024,
        parser: parseInt,
        validators : [(x,raw) => !isNaN(x) || `${raw} IS INVALID!`],
    },

    {
        key: 'maxProcessCount',
        description: 'SPECIFY MAX PROCESS COUNT',
        default: 64,
        parser: parseInt,
        validators: [(x, raw) => !isNaN(x) || `${raw} IS INVALID!`],
    },

    {
        key: 'maxOpenFiles',
        description: 'SPECIFY MAX FILE COUNT PER JOB',
        default: 2048,
        parser: parseInt,
        validators: [(x,raw) => !isNaN(x) || `${raw} IS INVALID!`],
    },

    {
        key: 'maxFileSize',
        description: 'MAX FILE SIZE (BYTES)',
        default: 10000000, //10MB
        parser: parseInt,
        validators: [(x, raw) => !isNaN(x) || `${raw} IS INVALID`],
    },

    {
        key: 'compileMemoryLimit',
        description: 'COMPILE TIME MEMORY LIMIT (-1 FOR NO LIMIT)',
        default: -1, // no limit
        parser: parseInt,
        validators: [(x, raw) => !isNaN(x) || `${raw} IS INVALID`],
    },

    {
        key: 'runtimeMemoryLimit',
        description: 'RUN TIME MEMORY LIMIT (-1 FOR NO LIMIT)',
        default: -1, // no limit
        parser: parseInt,
        validators: [(x, raw) => !isNaN(x) || `${raw} IS INVALID`],
    },

    {
        key: 'repoURL',
        description: 'REPO URL FOR SYNC',
        default: 'https://github.com/engineer-man/piston/releases/download/pkgs/index',
        validators: [],
    },
]

const logger = Logger.create('config');

logger.info('LOADING CONFIGURATION');
let failed = false;

let config = {};

options.forEach(option => {
    const environmentKey = 'EXECUTR_' + option.key.toUpperCase();
    const parser = option.parser || (x => x);
    const environmentValue = process.env[environmentKey];
    const parsed  = parser(environmentValue);
    const value = environmentValue || option.default;

    option.validators.forEach(validator => {
        let response = null;

        if(environmentValue){
            response = validator(parsed, environmentValue);
        } else {
            response = validator(value, value);
        }

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

logger.info('CONFIGURATION LOADED SUCCESSFULLY!');

module.exports = config;