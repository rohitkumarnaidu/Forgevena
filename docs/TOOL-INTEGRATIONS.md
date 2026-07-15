# Tool Integrations

This workspace keeps official third-party installation separate from project configuration.

| Tool | Workspace handling | Official next step |
| --- | --- | --- |
| OpenSpec | `add openspec` creates workflow guidance only. | Install `@fission-ai/openspec` globally, then manually run `openspec init` in the target project after reviewing its changes. |
| gstack | Deferred adapter. | Install with the upstream `setup` script targeting the agent host; it supports Codex through `--host codex`. |
| SkillOpt | Deferred adapter. | Use its Python 3.10+ package/repository setup and keep training artifacts project-scoped. |
| design.md | `add design` creates a local `DESIGN.md`. | Use the upstream specification as the design-system reference. |
| astryx | Reference only. | Evaluate components and licensing before selecting it for an application. |
| claude-mem | Deferred adapter. | Configure its supported agent integration and review its local memory/data settings before enabling it. |
| GitNexus | Deferred adapter. | Run its analysis command from a Git repository after installation. |
| Understand Anything | Deferred adapter. | Install using the upstream plugin or installer for the selected coding agent. |

Do not put API credentials in workspace files. Use an environment-specific secret manager or untracked environment files.
