const is_docker = require('is-docker');
const filesystem = require('fs');
const platform = `${is_docker() ? 'docker' : 'baremetal'}-${filesystem
    .readFileSync('/etc/os-release')
    .toString()
    .split('\n')
    .find(x => x.startsWith('ID'))
    .replace('ID=', '')}`;

module.exports = {
    dataDirectories: {
        packages: 'packages',
        jobs: 'jobs',
    },

    version: require('../package.json').version,
    platform,
    installedPackages: '.langman-installed',
    cleanupDirectories: ['/dev/shm' , '/run/lock', '/tmp', '/var/tmp'],
};
