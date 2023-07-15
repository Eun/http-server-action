const process = require('process');
const core = require('@actions/core');
const server = require('./server.js');

if (process.argv.length === 3 && process.argv[2] === 'serve') {
    process.on('SIGTERM', () => {
        process.exit(0);
    });

    process.on('message', (msg) => {
        core.debug(`child: starting server with ${JSON.stringify(msg.config, null, 2)}`);
        server.deploy(msg.config, () => {
            core.debug(`child: server started`);
            process.send({
                state: 'serving',
                pid: process.pid,
            });
        });
    })

    core.debug('child: server is ready');
    process.send({
        state: 'ready',
        pid: process.pid,
    });
    return;
}

let config = {
    root: null,
    port: null,
    noCache: null,
    indexFiles: null,
    allowedMethods: null,
    contentTypes: null,
    log: null,
    logTime: null
};

config.root = core.getInput('directory');
if (config.root === null || config.root.length == 0) {
    config.root = '.';
}

config.port = core.getInput('port');
if (config.port === null || config.port.length == 0) {
    config.port = 8080;
} else {
    const parsed = Number.parseInt(config.port);
    if (Number.isNaN(parsed)) {
        core.error(`Error: unable to parse input port "${config.port}"`);
        return;
    }
    config.port = parsed;
}

config.noCache = core.getInput('no-cache');
if (config.noCache === null || config.noCache.length == 0) {
    config.noCache = false;
} else {
    config.noCache = config.noCache === 'true';
}

config.indexFiles = core.getInput('index-files');
if (config.indexFiles === null || config.indexFiles.length == 0) {
    config.indexFiles = [];
} else {
    config.indexFiles = JSON.parse(config.indexFiles);
}

config.contentTypes = core.getInput('content-types');
if (config.contentTypes === null || config.contentTypes.length == 0) {
    config.contentTypes = {
        appcache: 'text/cache-manifest',
        css: 'text/css',
        gif: 'image/gif',
        html: 'text/html',
        ico: 'image/x-icon',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        js: 'text/javascript',
        json: 'application/json',
        png: 'image/png',
        txt: 'text/plain',
        xml: 'text/xml'
    };
} else {
    config.contentTypes = JSON.parse(config.contentTypes);
}

config.allowedMethods = core.getInput('allowed-methods');
if (config.allowedMethods === null || config.allowedMethods.length == 0) {
    config.allowedMethods = ['GET', 'HEAD'];
} else {
    config.allowedMethods = JSON.parse(config.allowedMethods);
}

config.log = core.getInput("log");

config.logTime = core.getInput('logTime');
if (config.logTime === null || config.logTime.length == 0) {
    config.logTime = true;
} else {
    config.logTime = config.logTime === 'true';
}

const cp = require('child_process');
const child = cp.fork(__filename, ['serve'], { detached: true, silent: true });
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
            core.debug(`master: server ready at ${msg.pid}`);
            core.debug(`master: starting server with ${JSON.stringify(config, null, 2)}`);
            child.send({
                config: config,
            });
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
    } catch (e) {
        // process is dead
        core.error(`Error: server is dead`);
        process.exit(1);
    }
}, 5000);