# ADR 0010: Governed MCP and Plugins

Custom MCP definitions are permitted but disabled until explicit activation. Remote servers require HTTPS except for loopback development and may reference secrets only through environment variables. Phase 5 plugins are declarative, permission-scoped, integrity-locked, and non-executable. Arbitrary plugin code requires a future sandbox ADR.
