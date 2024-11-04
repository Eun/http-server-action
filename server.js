const http = require("http");
const path = require("path");
const process = require("process");
const fs = require("fs");

function deploy(config, ready) {
  console.log("Deploying server with config: ", config);
  const server = http.createServer();
  const formatTime = Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  if (
    config.root === undefined ||
    config.root === null ||
    config.root.length == 0
  ) {
    config.root = process.cwd();
  }
  if (config.port === undefined || config.port === null || config.port === 0) {
    config.port = 8080;
  }
  if (config.noCache === undefined || config.noCache === null) {
    config.noCache = false;
  }
  if (config.indexFiles === undefined || config.indexFiles === null) {
    config.indexFiles = [];
  }
  if (config.allowedMethods === undefined || config.allowedMethods === null) {
    config.allowedMethods = ["GET", "HEAD"];
  }
  if (
    config.contentTypes === undefined ||
    config.contentTypes === null ||
    config.contentTypes.length == 0
  ) {
    config.contentTypes = {};
  }
  if (config.log == undefined || config.log == null) {
    config.log = "";
  }
  if (config.logTime == undefined || config.logTime == null) {
    config.logTime = true;
  }

  const root = path.resolve(path.normalize(config.root));
  let cwd = root;
  if (!root.endsWith(path.sep)) {
    cwd += path.sep;
  }

  function toPosixPath(url) {
    return path.posix.join(...url.split(path.sep));
  }

  function serveRequestedFile(
    config,
    request,
    response,
    requestedFile,
    statusCode,
  ) {
    let stat = fs.statSync(requestedFile);
    if (stat.isDirectory()) {
      if (!requestedFile.endsWith(path.sep)) {
        requestedFile += path.sep;
      }
      const noIndexFound = config.indexFiles.every((elem) => {
        const indexFile = requestedFile + elem;
        if (fs.existsSync(indexFile)) {
          requestedFile = indexFile;
          stat = fs.statSync(requestedFile);
          return false;
        }
        return true;
      });

      if (noIndexFound) {
        response.writeHead(statusCode, {
          "Content-Type": "text/html",
        });

        if (request.method === "HEAD") {
          response.end();
          return;
        }
        response.write("<pre>\n");

        let parentDir = path.resolve(
          path.normalize(path.join(requestedFile, "..")),
        );
        if (!parentDir.endsWith(path.sep)) {
          parentDir += path.sep;
        }
        if (parentDir.startsWith(cwd)) {
          let parentLink = "/" + toPosixPath(parentDir.slice(cwd.length));
          if (parentLink === "/.") {
            parentLink = "/";
          }
          response.write(`<a href="${parentLink}">..</a>\n`);
        }

        for (const file of fs.readdirSync(requestedFile)) {
          const fullPath = requestedFile + file;
          response.write(
            `<a href="/${toPosixPath(fullPath.slice(cwd.length))}">${file}</a>\n`,
          );
        }
        response.write("</pre>");
        response.end();
        return;
      }
    }

    let headers = {
      "Content-Length": stat.size,
    };

    const contentType = path.extname(requestedFile).slice(1);
    if (config.contentTypes[contentType]) {
      headers["Content-Type"] = config.contentTypes[contentType];
    }
    response.writeHead(statusCode, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    var readStream = fs.createReadStream(requestedFile);
    readStream.pipe(response);
  }

  function serve404DefaultPage(response) {
    const body = "Not Found";
    response.writeHead(404, {
      "Content-Length": Buffer.byteLength(body),
      "Content-Type": "text/plain",
    });
    response.end(body);
  }

  let txtLogger = undefined;
  if (config.log !== "") {
    txtLogger = fs.createWriteStream(config.log, {
      flags: "as",
    });
  }

  server.on("request", (request, response) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;
    });

    request.on("end", () => {
      if (config.log !== "") {
        let now = config.logTime ? `[${formatTime.format(new Date())}] ` : "";
        txtLogger.write(
          `${now}${request.method} ${request.url} ${JSON.stringify(data)}\n`,
        );
      }

      if (config.noCache) {
        response.setHeader(
          "Cache-Control",
          "no-cache, no-store, must-revalidate",
        );
      }

      if (!config.allowedMethods.includes(request.method)) {
        const body = "Method Not Allowed";
        response.writeHead(405, {
          "Content-Length": Buffer.byteLength(body),
          "Content-Type": "text/plain",
        });
        response.end(body);
        return;
      }
      let url = new URL(request.url, `http://${request.headers.host}`);
      let requestedFile = path.resolve(
        path.normalize(path.join(cwd, ...url.pathname.split(path.posix.sep))),
      );
      if (requestedFile !== root) {
        if (!requestedFile.startsWith(cwd) || !fs.existsSync(requestedFile)) {
          if (!config.custom404Page) {
            serve404DefaultPage(response);
            return;
          }

          url = new URL(config.custom404Page, `http://${request.headers.host}`);
          requestedFile = path.resolve(
            path.normalize(
              path.join(cwd, ...url.pathname.split(path.posix.sep)),
            ),
          );

          if (!requestedFile.startsWith(cwd) || !fs.existsSync(requestedFile)) {
            serve404DefaultPage(response);
            return;
          }

          serveRequestedFile(config, request, response, requestedFile, 404);
          return;
        }
      }

      serveRequestedFile(config, request, response, requestedFile, 200);
    });
  });

  server.listen(config.port, () => {
    ready(server);
  });
}

exports.deploy = deploy;
