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
| `providers` | Manages provider profiles, credentials, policies, authentication, status, test calls, and live invocation. |
| `dashboard` | Starts a token-protected loopback settings page for providers and integration readiness. |
| `mcp` | Registers, validates, health-checks, activates, deactivates, or removes project MCP definitions. |
| `plugins` | Installs, integrity-checks, enables, disables, or removes declarative plugins. |
| `cloud render` | Generates and validates a Blueprint, records service IDs, deploys, reads status, or prepares rollback guidance. |
| `doctor` | Aggregates environment, provider, credential, cloud, MCP, plugin, and workspace health without returning secrets. |
| `validate` | Validates the generated project baseline and template assets. |
| `rollback [operation]` | Previews reversal of the latest managed operation; apply requires `--yes`. |

## Important Flags

- `--apply`: perform an additive project change.
- `--yes`: explicit confirmation for non-interactive external actions and managed rollback.
- `--non-interactive`: disables prompts; external execution without `--yes` fails safely.
- `--verbose`: wraps JSON output with command diagnostics.
- `--skip <module-or-path,...>`: omits selected additive assets.

## Phase 5 Examples

Run `ai-workspace --help` for the complete command matrix. All local modifications preview by default. Credential values are accepted only through masked prompts; external operations require explicit consent.

```powershell
node .\bin\ai-workspace.js providers invoke openai --prompt "Reply with OK" --apply
node .\bin\ai-workspace.js providers dashboard
node .\bin\ai-workspace.js mcp add docs --transport http --url https://example.com/mcp --header-environment-json '{"Authorization":"DOCS_MCP_AUTH"}' --apply
node .\bin\ai-workspace.js mcp activate docs --host codex --apply
node .\bin\ai-workspace.js plugins install .\plugin.json --apply
node .\bin\ai-workspace.js cloud render generate --apply
node .\bin\ai-workspace.js cloud render validate
```

Provider, MCP health, host authentication, and cloud deployment commands preview external scope by default and require explicit apply/confirmation.
