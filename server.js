const http = require('http');
const path = require('path');
const process = require('process');
const fs = require('fs');


function deploy(config, ready) {
    const server = http.createServer();

    if (config.root === undefined || config.root === null || config.root.length == 0) {
        config.root = process.cwd();
    }
    if (config.port === undefined || config.port === null || config.port === 0) {
        config.port = 8080;
    }
    if (config.noCache === undefined || config.noCache === null) {
        config.noCache = false;
    }
	if (config.checkIndex === undefined || config.checkIndex === null) {
        config.checkIndex = false;
    }
    if (config.contentTypes === undefined || config.contentTypes === null || config.contentTypes.length == 0) {
        config.contentTypes = {};
    }

    const root = path.resolve(path.normalize(config.root));
    let cwd = root;
    if (!root.endsWith(path.sep)) {
        cwd += path.sep;
    }


    function toPosixPath(url) {
        return path.posix.join(...url.split(path.sep));
    }

    server.on('request', (request, response) => {
        if (config.noCache) {
            response.setHeader(
                'Cache-Control',
                'no-cache, no-store, must-revalidate'
            );
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.writeHead(405, 'Method Not Allowed');
            response.end();
            return;
        }
        const url = new URL(request.url, `http://${request.headers.host}`);
        let requestedFile = path.resolve(path.normalize(path.join(cwd, ...url.pathname.split(path.posix.sep))));
        if (requestedFile !== root) {
            if (!requestedFile.startsWith(cwd)) {
                response.writeHead(404, 'Not found');
                response.end();
                return;
            }

            if (!fs.existsSync(requestedFile)) {
                response.writeHead(404, 'Not found');
                response.end();
                return;
            }
        }

        const stat = fs.statSync(requestedFile);

        if (stat.isDirectory()) {
			let indexFound = false;
			if (config.checkIndex) {
				if(fs.existsSync(requestedFile + '/index.html')){
					requestedFile = requestedFile + '/index.html';
					indexFound = true;
				}
			}
			if(!indexFound) {
				response.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
				if (config.checkIndex) {
					response.write('<pre>NO_INDEX.HTML_FOUND</pre>');
				}
				if (!requestedFile.endsWith(path.sep)) {
					requestedFile += path.sep;
				}
				if (request.method === 'HEAD') {
					response.end();
					return;
				}
				response.write('<pre>\n');

				let parentDir = path.resolve(path.normalize(path.join(requestedFile, '..')));
				if (!parentDir.endsWith(path.sep)) {
					parentDir += path.sep;
				}
				if (parentDir.startsWith(cwd)) {
					let parentLink = '/' + toPosixPath(parentDir.slice(cwd.length));
					if (parentLink === '/.') {
						parentLink = '/';
					}
					response.write(`<a href="${parentLink}">..</a>\n`);
				}

				for (const file of fs.readdirSync(requestedFile)) {
					const fullPath = requestedFile + file;
					response.write(`<a href="/${toPosixPath(fullPath.slice(cwd.length))}">${file}</a>\n`);
				}
				response.write('</pre>');
				response.end();
				return;
			}
        }

        const contentType = path.extname(requestedFile).slice(1);

        let headers = {
            'Content-Length': stat.size,
        }

        if (config.contentTypes[contentType]) {
            headers['Content-Type'] = config.contentTypes[contentType];
        }
        response.writeHead(200, 'OK', headers);
        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        var readStream = fs.createReadStream(requestedFile);
        readStream.pipe(response);
    });

    server.listen(config.port, () => {
        ready(server);
    });
}


exports.deploy = deploy;