# AI Engineering Workspace

A local, safety-first CLI for bootstrapping and augmenting AI-assisted software projects.

## Safety Model

- Every project change previews by default; use `--apply` to write.
- Existing files, manifests, and application directories are always skipped.
- Global tool installation and reference cloning display scope, network/data impact, paths, and rollback limits before execution.
- Non-interactive external actions require `--apply --yes`.
- Provider profiles contain only environment-variable or host-managed references; no API key is stored or requested.

## Core Commands

```powershell
node .\bin\ai-workspace.js doctor
node .\bin\ai-workspace.js create DemoApi --template fastapi
node .\bin\ai-workspace.js init --dry-run --verbose
node .\bin\ai-workspace.js install openspec
node .\bin\ai-workspace.js reference design-md
node .\bin\ai-workspace.js providers init openai
node .\bin\ai-workspace.js validate
node .\bin\ai-workspace.js rollback
```

See `docs/CLI.md`, `docs/TOOL-INTEGRATIONS.md`, `docs/PHASE_TRACEABILITY.md`, and `docs/examples/` for full usage.
