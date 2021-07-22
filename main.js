const process = require('process');

if (process.argv.length === 5 && process.argv[2] === 'serve') {
    const server = require('node-http-server');

    let config = new server.Config;
    config.verbose = false;
    config.port = Number.parseInt(process.argv[3]);
    config.root = process.argv[4];

    server.deploy(config, () => {
        process.send({
            pid: process.pid,
        });
    });

    process.on('SIGTERM', () => {
        process.exit(0);
    });

    return;
}


const core = require('@actions/core');

let directory = core.getInput('directory');
if (directory === null || directory.length == 0) {
    directory = '.';
}

let port = core.getInput('port');
if (port === null || port.length == 0) {
    port = 8080;
} else {
    switch (typeof(port)) {
        case 'string':
            const parsed = Number.parseInt(port);
            if (Number.isNaN(parsed)) {
                core.error(`Error: unable to parse input port "${port}"`);
                return;
            }
            port = parsed;
            break;
        case 'number':
            break;
        default:
            core.error(`Error: input port was not a string or number, it was a ${typeof(port)}`);
            process.exit(1);
            return;
    }
}

const cp = require('child_process');
const child = cp.fork(__filename, ['serve', port, directory], {detached: true});
child.on('error', (err) => {
    core.error(`Error: unable to spawn server: ${err}`);
});
child.on('message', (msg) => {
    if (msg.pid === undefined || msg.pid === null) {
        core.error(`Error: invalid message`);
        child.kill();
        process.exit(1);
        return;
    }
    if (msg.pid != child.pid) {
        core.error(`Error: expected pid ${child.pid}, but got ${msg.pid}`);
        child.kill();
        process.exit(1);
        return;
    }
    core.saveState('pid', msg.pid);
    core.info('server running');
    core.debug(`server running at ${msg.pid}`);
    process.exit(0);
    return;
});

// test if the server was started
setTimeout(() => {
    try {
        process.kill(child.pid, 0);
        // process is alive but did not send an message
        core.error(`Error: server was started but never notified its presence.`);
        child.kill();
        process.exit(1);
        return;
    } catch(e) {
        // process is dead
        core.error(`Error: server is dead`);
        process.exit(1);
    }
}, 5000);