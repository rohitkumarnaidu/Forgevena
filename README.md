# AI Engineering Workspace

A local, safety-first developer platform for bootstrapping projects, configuring live AI providers, governing MCP/plugin integrations, and preparing Git-backed Render deployments.

Current release: `1.0.0`. Install with `npm install --global ai-engineering-workspace@1.0.0` after publication, or use the verified offline archive.

## Safety Model

- Every project change previews by default; use `--apply` to write.
- Existing files, manifests, and application directories are always skipped.
- Global tool installation and reference cloning display scope, network/data impact, paths, and rollback limits before execution.
- Non-interactive external actions require `--apply --yes`.
- Provider profiles contain only environment-variable or host-managed references. Optional masked development setup may create a new ignored `.env`, but never modifies an existing file.
- Prompts, responses, credentials, authorization headers, and MCP payloads are never written to logs.
- MCP servers and declarative plugins are disabled until explicitly activated.

## Core Commands

```powershell
node .\bin\ai-workspace.js doctor
node .\bin\ai-workspace.js create DemoApi --template fastapi
node .\bin\ai-workspace.js init --dry-run --verbose
node .\bin\ai-workspace.js install openspec
node .\bin\ai-workspace.js reference design-md
node .\bin\ai-workspace.js providers init openai
node .\bin\ai-workspace.js providers limits openai --mode budgeted --monthly-request-limit 100 --apply
node .\bin\ai-workspace.js providers invoke openai --prompt "Hello" --apply
node .\bin\ai-workspace.js dashboard
node .\bin\ai-workspace.js mcp list
node .\bin\ai-workspace.js plugins list
node .\bin\ai-workspace.js cloud render generate --apply
node .\bin\ai-workspace.js validate
node .\bin\ai-workspace.js rollback
```

See `docs/CLI.md`, `docs/SECURITY.md`, `docs/EXTERNAL_INTEGRATION_COMMANDS.md`, `docs/PROVIDER_CONFIGURATION.md`, `docs/MCP_AND_PLUGINS.md`, `docs/CLOUD_PLATFORMS.md`, `docs/RENDER_DEPLOYMENT.md`, `docs/TROUBLESHOOTING.md`, `docs/FAQ.md`, `docs/DEVELOPMENT.md`, `docs/RELEASE_GUIDE.md`, and `docs/PHASE_TRACEABILITY.md` for full usage.
