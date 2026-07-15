# CLI Specification

## Available v1 commands

| Command | Behavior |
| --- | --- |
| `doctor` | Read-only environment and project detection. |
| `status` | Reads the local workspace registry. |
| `init` | Previews baseline OpenSpec guidance, design, documentation, and AI-context assets. |
| `create <name>` | Previews a new Git project with baseline assets; use `--apply` to create it. |
| `add <module>` | Previews one approved project module. |
| `install <tool>` | Shows an official tool installation plan; `--apply` executes supported plans. |
| `reference <name>` | Shows an approved reference repository clone plan; `--apply` clones it under the workspace `reference/` directory. |

Use `--dry-run` with `init`, `create`, or `add` to preview additions without modifying files.
Use `--help` with any command to print the available command reference.

## Deferred commands

`update` safely reruns selected module templates and creates only missing files. `rollback` restores the latest saved workspace registry only; it deliberately preserves project files.
