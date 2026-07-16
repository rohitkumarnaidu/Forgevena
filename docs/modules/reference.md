# Module Reference

All modules expose a common lifecycle contract: metadata, status, validation, update planning, safe removal response, and managed rollback scope. Module assets come from the template layer; collisions are skipped.

| Module | Purpose | Key dependencies / outputs |
|---|---|---|
| `core` | Workspace identity and safety guidance | `.ai-workspace/`, README assets |
| `doctor` | Environment diagnostics | runtime/tool detection |
| `bootstrap` | Creation and initialization guidance | project engine |
| `registry` | Workspace lifecycle state | `workspace.json` |
| `logging` | Redacted local events | `logs/` |
| `config` | Non-secret defaults | `configs/` |
| `templates` | Versioned scaffold assets | `templates/` |
| `providers` | Provider profiles and policy | `.ai-workspace/providers/` |
| `project` | Project metadata and conventions | documentation assets |
| `docs` | Enterprise documentation tree | `docs/` |
| `design` | Visual identity contract | `DESIGN.md` |
| `testing` | Unit/integration/e2e structure | `tests/` |
| `docker` | Container guidance/assets | Docker documentation or stack assets |
| `monitoring` | Logging, health, metrics, tracing guidance | monitoring docs/config |
| `github` | CI and PR templates | `.github/` |
| `ai` | Project-local non-secret context | `.ai/`, `prompts/`, `configs/` |

## Lifecycle example

```powershell
ai-workspace add docs --dry-run --verbose
ai-workspace add docs --apply
ai-workspace status
ai-workspace validate
```

Extension points are additive module templates and registry metadata. Do not bypass `moduleContract` or write directly from the CLI. See [Developer guide](../developer/index.md).
