# Integration Reference

External tools remain upstream-owned. The platform records metadata, plans official installation, creates only missing project artifacts, validates detected outputs, and removes registry state without deleting unmanaged files.

| Integration | Purpose | Official workflow | Project artifact / health signal |
|---|---|---|---|
| OpenSpec | Specification management | `npm install -g @fission-ai/openspec@latest`; separately review `openspec init` | `openspec/` |
| SkillOpt | Natural-language skill optimization | `pip install skillopt` | `.skillopt/`, `best_skill.md` |
| gstack | Agent workflow skills | Manual upstream `./setup --host <host>` | `.agents/skills/gstack` |
| design.md | Persistent design contract | `npx @google/design.md lint DESIGN.md` | `DESIGN.md` |
| Astryx | Design-system reference | Manual license and adoption review | No automatic artifact |
| claude-mem | Persistent agent memory | `npx claude-mem install` | `.claude-mem` |
| GitNexus | Repository code intelligence | `npx gitnexus analyze` | `.gitnexus` |
| Understand Anything | Repository knowledge graph | Manual selected-host marketplace workflow | `.understand-anything` |

## Lifecycle

```powershell
ai-workspace integrations install openspec
ai-workspace integrations init openspec --dry-run
ai-workspace integrations init openspec --apply
ai-workspace integrations validate openspec
ai-workspace integrations health openspec
ai-workspace integrations remove openspec --dry-run
```

Installation plans disclose command scope, network/data impact, paths, and rollback limitations. Manual-only tools never receive invented installers. If health remains `not-initialized`, complete the official workflow and rerun validation.
