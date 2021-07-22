const process = require('process');
const server = require('node-http-server');

if (process.argv.length === 3 && process.argv[2] === 'serve') {
    process.on('SIGTERM', () => {
        process.exit(0);
    });

    process.on('message', (msg) => {
        server.deploy(msg.config, () => {
            process.send({
                state: 'serving',
                pid: process.pid,
            });
        });
    })

    process.send({
        state: 'ready',
        pid: process.pid,
    });
    return;
}


const core = require('@actions/core');

let config = {
    verbose: false,
    server: {
        noCache: false,
    }
};


config.root = core.getInput('directory');
if (config.root === null || config.root.length == 0) {
    config.root = '.';
}

config.port = core.getInput('port');
if (config.port === null || config.port.length == 0) {
    config.port = 8080;
} else {
    switch (typeof(config.port)) {
        case 'string':
            const parsed = Number.parseInt(config.port);
            if (Number.isNaN(parsed)) {
                core.error(`Error: unable to parse input port "${config.port}"`);
                return;
            }
            config.port = parsed;
            break;
        case 'number':
            break;
        default:
            core.error(`Error: input port was not a string or number, it was a ${typeof(config.port)}`);
            process.exit(1);
            return;
    }
}

config.server.noCache = core.getInput('no-cache');
if (config.server.noCache === null || config.server.noCache.length == 0) {
    config.server.noCache = false;
} else {
    switch (typeof(config.server.noCache)) {
        case 'string':
            config.server.noCache = config.server.noCache === 'true';
            break;
        case 'boolean':
            break;
        default:
            core.error(`Error: input no-cache was not a string or boolean, it was a ${typeof(config.port)}`);
            process.exit(1);
            return;
    }
}

console.log(core.getInput('content-type'))

const cp = require('child_process');
const child = cp.fork(__filename, ['serve'], {detached: true});
child.on('error', (err) => {
    core.error(`Error: unable to spawn server: ${err}`);
    process.exit(1);
    return;
});
child.on('message', (msg) => {
    if (msg.state === undefined || msg.state === null || msg.pid === undefined || msg.pid === null) {
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

    switch (msg.state) {
        case 'ready':
            core.debug(`server ready at ${msg.pid}`);
            child.send(config);
            break;
        case 'serving':
            core.saveState('pid', msg.pid);
            core.info('server running');
            process.exit(0);
            break;
    }
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