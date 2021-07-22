const process = require('process');
const core = require('@actions/core');

var pid = core.getState("pid");
process.kill(pid, 'SIGTERM');


setTimeout(() => {
    try {
        process.kill(pid, 0);
        // process is still alive
        process.kill(pid, 'SIGINT');
    } catch(e) {
        // process is already dead
    }
}, 100);