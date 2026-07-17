# Runtime Plugins

Runtime plugins use manifest schema version 2 and execute in a separate Node.js process over JSON-RPC 2.0.

The host validates platform constraints, semantic versions, dependencies, permissions, capabilities, entry containment, timeouts, and output limits before execution. Runtime processes receive a minimal environment without provider credentials or workspace secrets and run with Node's permission system enabled.

Long-lived platform processes can use `PluginRuntimeHost` to start a worker once, invoke multiple declared capabilities, inspect status, reload after an approved update, and stop it deterministically. Existing one-shot plugins remain supported through `invokeRuntimePlugin` for backward compatibility.

Runtime execution is preview-first:

```powershell
forgevena plugins install .\plugin\manifest.json --apply
forgevena plugins enable example --apply
forgevena plugins permissions example
forgevena plugins dependencies example
forgevena plugins run example --method ping --dry-run
forgevena plugins run example --method ping --apply
```

Remote runtime packages remain disabled until signed package transport and complete package-integrity verification are implemented. Existing signed declarative plugins remain compatible.

Direct credentials are never passed to plugins. Future provider and managed-workspace operations must use scoped host-mediated capabilities.
