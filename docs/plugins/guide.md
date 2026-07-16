# Plugins and MCP

## Plugin lifecycle

Plugins are declarative manifests. Installation validates schema, identifier, publisher, supported permissions, hashes/signatures where configured, and registry collisions. Allowed permissions are provider profile, MCP definition, documentation, and template metadata.

```powershell
ai-workspace plugins install <path-or-url> --dry-run
ai-workspace plugins trust <publisher> --apply
ai-workspace plugins install <path-or-url> --apply --yes
ai-workspace plugins validate <id>
ai-workspace plugins enable <id> --apply
ai-workspace plugins health <id>
```

Plugins start disabled. Removal deletes registry-managed plugin state only.

## MCP lifecycle

```powershell
ai-workspace mcp add <name> --url https://example.test/mcp --dry-run
ai-workspace mcp add <name> --url https://example.test/mcp --apply
ai-workspace mcp validate <name>
ai-workspace mcp activate <name> --host codex --apply
ai-workspace mcp health <name>
```

Remote endpoints require HTTPS; loopback HTTP is allowed. Inline URL credentials are rejected. Activation is explicit and host-scoped. Health checks use bounded retries and timeouts.

For packaging, provide a signed manifest and only declarative assets. Do not embed executable hooks or credentials. See `examples/plugin/manifest.json`.
