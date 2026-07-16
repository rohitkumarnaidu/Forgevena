# MCP and Declarative Plugins

## MCP Servers

Register a custom server without activating it:

```powershell
node .\bin\ai-workspace.js mcp add project-docs --transport http --url https://example.com/mcp --header-environment-json '{"Authorization":"PROJECT_DOCS_MCP_AUTH"}' --apply
node .\bin\ai-workspace.js mcp validate project-docs
node .\bin\ai-workspace.js mcp health project-docs --apply
node .\bin\ai-workspace.js mcp activate project-docs --host codex --apply
```

Remote endpoints require HTTPS; loopback HTTP is allowed for local development. Header values are read from environment variables only. Activation writes a project registry entry and an additive generated host-configuration example; it never overwrites an existing host configuration.

## Plugins

Phase 5 plugins are declarative manifests with schema version, semantic version, permissions, contributions, and an integrity lock. They cannot execute code.

Remote plugin manifests additionally require a valid Ed25519 signature from an explicitly trusted publisher. Trust records contain public keys and fingerprints only; private keys and provider credentials are never stored.

```powershell
node .\bin\ai-workspace.js plugins trust example --public-key-file .\publisher-public.pem
node .\bin\ai-workspace.js plugins trust example --public-key-file .\publisher-public.pem --apply
node .\bin\ai-workspace.js plugins install https://plugins.example.com/manifest.json --apply
```

```json
{
  "schemaVersion": 1,
  "id": "project-policy",
  "version": "1.0.0",
  "type": "declarative",
  "permissions": ["documentation", "mcp-definition"],
  "contributions": {}
}
```

```powershell
node .\bin\ai-workspace.js plugins install .\plugin.json --apply
node .\bin\ai-workspace.js plugins validate project-policy
node .\bin\ai-workspace.js plugins enable project-policy --apply
```

Remote HTTPS manifests require external-action consent. Removal is registry-only and preserves cached evidence for auditing.
