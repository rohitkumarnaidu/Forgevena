# CLI Application Boundaries

The CLI uses separate option parsing, command routing, application context, rendering, and structured error contracts.

`CommandRouter` owns command lookup and dispatch. Domain handlers receive a request containing the workspace root, parsed options, arguments, and injected application context. The router does not read files, request consent, invoke providers, or render output.

Default JSON output remains compatible with Forgevena 1.x. `--structured` adds a versioned operation envelope containing an operation identifier, status, warnings, changes, and stable error metadata.

Further decomposition will move domain handlers out of the CLI composition module without changing public commands.
