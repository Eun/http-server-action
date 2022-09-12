# http-server-action
---
An action that spawns an http server to serve files. 
This project is forked from https://github.com/Eun/http-server-action

Changes: Improved to handle index.html in root of directories.

## Inputs
### `directory`
Path that should be served (default is `.`) (*optional*)

### `port`
Port that should be used (default is `8080`) (*optional*)

### `no-cache`
No-Cache determiantes wheter the server sets the Cache-Control header or not (default is `false`) (*optional*)

### `index-files`
If set and directory is requested, look for those files, instead of show directory listing (default is EMPTY, sample is `["index.html", "index.htm"]`) (*optional*)

### `allowed-methods`
Throw HTTP-Error 405 on other methods than the methods given (default is `["GET", "HEAD"]`) (*optional*)

### `content-types`
A JSON object of content-types that should be served (*optional*)
Default:
```json
{
  "appcache": "text/cache-manifest",
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "png": "image/png",
  "txt": "text/plain",
  "xml": "text/xml"
}
```

## Example
```yaml
steps:
  -
    name: Checkout code
    uses: actions/checkout@v2
  -
    name: Serve Files
    uses: Eun/http-server-action@v1
    with:
      directory: ${{ github.workspace }}
      port: 8080
      no-cache: false
      index-files: |
        ["index.html", "index.htm"]
	  allowed-methods: |
        ["GET", "HEAD"]
      content-types: |
        {
          "appcache": "text/cache-manifest",
          "css": "text/css",
          "gif": "image/gif",
          "html": "text/html",
          "ico": "image/x-icon",
          "jpeg": "image/jpeg",
          "jpg": "image/jpeg",
          "js": "text/javascript",
          "json": "application/json",
          "png": "image/png",
          "txt": "text/plain",
          "xml": "text/xml"
        }
  -
    run: curl -vvvv http://localhost:8080/index.html
```
