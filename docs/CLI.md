# CLI Reference

## Safe Defaults

All mutating project commands use dry-run mode unless `--apply` is supplied. Existing files are always skipped. `--merge merge` and `--merge replace` report intent but remain skip-only until an approved non-destructive merge ADR exists.

## Commands

| Command | Behavior |
| --- | --- |
| `doctor` | Detects operating system, developer tools, and project stack without writing files. |
| `create <name>` | Creates an empty-destination project from a named template. |
| `init` | Adds only missing workspace assets to the current repository. |
| `add <module>` | Adds one approved additive module. |
| `install [tool]` | Previews an official global installation; execution requires consent. |
| `reference [name]` | Previews an opt-in reference clone; execution requires consent. |
| `integrations` | Lists, registers, initializes, validates, updates, or removes registry state for an integration. |
| `providers` | Lists, initializes, and checks keyless provider/MCP readiness profiles. |
| `validate` | Validates the generated project baseline and template assets. |
| `rollback [operation]` | Previews reversal of the latest managed operation; apply requires `--yes`. |

## Important Flags

- `--apply`: perform an additive project change.
- `--yes`: explicit confirmation for non-interactive external actions and managed rollback.
- `--non-interactive`: disables prompts; external execution without `--yes` fails safely.
- `--verbose`: wraps JSON output with command diagnostics.
- `--skip <module-or-path,...>`: omits selected additive assets.

Live provider API calls and MCP/plugin activation are intentionally deferred to Phase 5.
