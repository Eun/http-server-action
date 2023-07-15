const http = require('http');
const fs = require('fs');
const process = require('process');

const options = {
    hostname: 'localhost',
    port: 9090,
    path: '/',
    method: 'POST',
};


const req = http.request(options, res => {
    const buf = fs.readFileSync('log.txt').toString();
    const expect = `POST /\n`
    if (expect !== buf) {
        console.error(`expected ${expect}, but got ${buf}`);
        process.exit(1);
        return;
    }
})

req.on('error', error => {
    console.error(error);
    process.exit(1);
    return;
});

req.write('Hello World');

req.end();