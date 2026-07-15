# AI Engineering Workspace

A local, safety-first foundation for adding AI engineering conventions to new or existing repositories.

## Status

Version `0.1.0` delivers the v1 CLI foundation. It creates only additive project assets, previews writes by default through `--dry-run`, records module state in `.ai-workspace/workspace.json`, and creates a timestamped backup before a real change.

## Commands

```powershell
node .\bin\ai-workspace.js doctor
node .\bin\ai-workspace.js init
node .\bin\ai-workspace.js init --apply
node .\bin\ai-workspace.js add openspec
node .\bin\ai-workspace.js add design --apply
node .\bin\ai-workspace.js add docs
node .\bin\ai-workspace.js add github
node .\bin\ai-workspace.js add testing
node .\bin\ai-workspace.js add docker
node .\bin\ai-workspace.js config
node .\bin\ai-workspace.js status
```

Run `init` or `add` from the target project directory. Every modifying command previews changes by default; add `--apply` only after reviewing the preview. Third-party tool integrations are intentionally deferred beyond the Phase 2 foundation.

## Safety guarantees

- Existing files are never overwritten.
- Application directories such as `src`, `backend`, and `frontend` are never modified.
- `--dry-run` lists intended additions without writing files.
- Before writes, a metadata backup is stored in `.ai-workspace/backups/`.

## Documentation

- `docs/ARCHITECTURE.md` — v1 architecture and boundaries.
- `docs/TOOL-INTEGRATIONS.md` — official installation guidance and scope for each tool.
- `docs/CLI.md` — command behavior and limitations.
