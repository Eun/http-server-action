const process = require('process');
const core = require('@actions/core');

var pid = core.getState('pid');

try {
    process.kill(pid, 'SIGTERM');
} catch {
    // process is already dead
    core.error(`Error: server is dead`);
    process.exit(1);
    return;
}



setTimeout(() => {
    try {
        process.kill(pid, 0);
        // process is still alive
        process.kill(pid, 'SIGINT');
    } catch(e) {
        // process is already dead
    }
}, 100);