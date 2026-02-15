const concurrently = require('concurrently');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const commands = [
    {
        command: 'npx ng serve login --port 4204',
        name: 'login',
        cwd: path.resolve(rootDir, 'LOGIN_MICRO_FRONTEND'),
        prefixColor: 'blue'
    },
    {
        command: 'npx ng serve alms-mf --port 4205',
        name: 'alms',
        cwd: path.resolve(rootDir, 'ALMS-AND-ESS-MicrofrontEnd'),
        prefixColor: 'magenta'
    },
    {
        command: 'npx ng serve auxillary-cnb-mf --port 4206',
        name: 'salary',
        cwd: path.resolve(rootDir, 'Salary_MFE'),
        prefixColor: 'green'
    },
    {
        command: 'npx ng serve Employee-MicroFrontend --port 4207',
        name: 'employee',
        cwd: path.resolve(rootDir, 'Employee_MFE'),
        prefixColor: 'yellow'
    },
    {
        command: 'npx ng serve shell --port 4200',
        name: 'shell',
        cwd: path.resolve(rootDir, 'LOGIN_MICRO_FRONTEND'),
        prefixColor: 'red'
    }
];

concurrently(commands, {
    killOthers: ['failure', 'success'],
    restartTries: 2,
    shell: true
});
