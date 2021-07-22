# http-server-action
---
An action that spawns an http server to serve files.

## Inputs
### `directory`
Path that should be served (default is `.`) (*optional*)

### `port`
Port that should be used (default is `8080`) (*optional*)

### `no-cache`
No-Cache determiantes wheter the server sets the Cache-Control header or not (default is `false`) (*optional*)

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
