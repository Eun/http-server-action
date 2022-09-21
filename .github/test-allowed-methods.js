const http = require('http');
const fs = require('fs');
const process = require('process');

const options = {
    hostname: 'localhost',
    port: 9090,
    path: '/',
    method: 'GET'
};


const req = http.request(options, res => {
    if (res.statusCode !== 405) {
        console.error(`expected 405, got ${res.statusCode}`);
        process.exit(1);
        return;
    }
    const buf = 'Method Not Allowed';
    let allTheData = "";

    res.on('data', d => {
        allTheData += d.toString();
    });

    res.on('end', () => {
        if (allTheData !== buf) {
            console.error(`expected ${buf}, but got ${allTheData}`);
            process.exit(1);
            return;
        }
    });
})

req.on('error', error => {
    console.error(error);
    process.exit(1);
    return;
});

req.end();