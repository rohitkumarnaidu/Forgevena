# V1 Architecture

## Scope

The workspace is a local CLI and loopback settings dashboard that add safe project assets and orchestrate explicitly approved external integrations. It is not itself a cloud service, autonomous agent orchestrator, or automatic installer for unreviewed third-party code.

## Components

- `bin/ai-workspace.js`: executable entrypoint.
- `src/cli.js`: command parsing and command dispatch.
- `src/doctor.js`: read-only environment and project detection.
- `src/project.js`: dry-run planning, additive writes, project registry, transaction rollback, logs, and registry backups.
- `src/tool-adapters.js`: explicit official installation plans for supported developer tools.
- `src/references.js`: opt-in clone plans for reference repositories.
- `src/templates.js`: small, versioned module templates.
- `src/provider-runtime.js` and `src/provider-policy.js`: capability-aware provider calls, host detection, redacted usage controls, and budgets.
- `src/dashboard.js`: loopback-only settings interface using the same services as the CLI.
- `src/mcp.js` and `src/plugins.js`: governed custom MCP and declarative plugin registries.
- `src/render.js`: additive Render Blueprint generation and consent-gated service operations.

## Safety model

`init` and `add` only create absent files. Existing files are recorded as skipped. The tool never writes application code, deletes paths, or infers runtime-specific configuration. Before a write it backs up the prior workspace registry; it does not claim to roll back unrelated project changes.

## Registry

Each initialized project owns `.ai-workspace/workspace.json`, which records the workspace version and modules. Memory, specs, and documentation remain scoped to that project rather than shared globally.

## Extension points

Tool adapters provide dry-run installation plans. Commands that are genuinely host-specific (such as gstack and agent plugins) return the official manual setup path rather than running an unverified sequence. All adapters must preserve the non-overwrite rule.
