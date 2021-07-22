# http-server-action
---
An action that spawns an http server to serve files.

## Inputs
### `directory`
Path that should be served (default is `.`) (*optional*)

### `Port`
Port that should be used (default is `8080`) (*optional*)


## Example
```yaml
steps:
  -
    name: Checkout code
    uses: actions/checkout@v2
  -
    name: Serve Files
    uses: Eun/http-server-action@v1
```
