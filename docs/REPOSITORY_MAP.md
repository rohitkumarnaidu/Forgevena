# Repository Map

| Path | Ownership and purpose |
|---|---|
| `.github/` | Community forms, ownership, funding, and release CI |
| `bin/` | Cross-platform CLI entry point |
| `src/` | Platform implementation domains |
| `test/` | Unit, integration, regression, CLI, and release tests |
| `docs/` | Product, engineering, operations, governance, audits, and release evidence |
| `examples/` | Declarative provider and plugin examples |
| `templates/` | Versioned project/workspace assets |
| `scripts/` | Installation, distribution, benchmark, and release verification |
| `completions/`, `man/` | Shell and manual-page distribution assets |
| `dist/` | Generated release artifacts; not source of truth |
| `.ai-workspace/` | Local workspace registry and managed state |

Runtime credentials, caches, logs, backups, and generated archives are local operational data and must not be committed unless a release process explicitly includes a sanitized artifact.
