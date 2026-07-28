# Capability Reference

Capabilities describe outcomes independently from upstream products.

| Capability | Integrations | Default | Maturity | Support |
|---|---|---|---|---|
| Specification management | OpenSpec | OpenSpec | `preview` | Community |
| Skill optimization | SkillOpt | SkillOpt | `preview` | Community |
| AI workflow | gstack | gstack | `preview` | Community |
| Design system | design.md, Astryx | design.md | `preview` | Community |
| Persistent memory | claude-mem | claude-mem | `preview` | Community |
| Code intelligence | GitNexus | GitNexus | `preview` | Community |
| Repository knowledge graph | Understand Anything | Understand Anything | `preview` | Community |

Use `ai-workspace capabilities` to inspect the mapping and `ai-workspace integrations status` to inspect project state. Capability resolution validates that a preferred integration implements the requested outcome.

Maturity follows the canonical definitions in the [Platform Constitution](../strategy/PLATFORM_CONSTITUTION.md). These upstream-backed capabilities remain `preview` until their compatibility, security, operational, and support evidence qualifies them for `stable`; none currently claim enterprise certification.
