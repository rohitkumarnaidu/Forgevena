# Configuration Reference

## Workspace defaults

Stored under `.ai-workspace/config.json` when changed.

| Key | Default | Description |
|---|---:|---|
| `output` | `json` | Structured CLI output format. |
| `logRetentionDays` | `30` | Local redacted event retention. |
| `confirmApply` | `true` | Require confirmation policy for applicable changes. |

```powershell
ai-workspace config
ai-workspace config logRetentionDays 14 --dry-run
ai-workspace config logRetentionDays 14 --apply
ai-workspace config export --output safe-config.json --apply
ai-workspace config import --input safe-config.json --dry-run
```

## Configuration scopes

- **Workspace:** registry, config, managed assets, providers, logs.
- **Project:** generated non-secret `.ai/`, `configs/`, provider selection.
- **Provider:** model, temperature, max output, timeout, retries, priority, limits.
- **Plugin/MCP:** declarative registries; disabled until explicitly activated.
- **Environment:** credentials and endpoints that must not be committed.

Safe exports exclude credential values and runtime payloads. Unknown configuration keys fail validation.

## Provider credential slots

Provider credentials can use isolated named slots. `primary` remains compatible with existing 1.x paths, while additional slots are stored in ignored provider-scoped locations. Registry metadata records only slot IDs, storage mode, lifecycle state, timestamps, and bounded audit events; it never records secret values.

Credential resolution is: process environment override, explicit managed active slot, then legacy compatibility paths. Environment-owned values cannot be activated, rotated, quarantined, recovered, or marked validated by Forgevena. Managed slot validation writes only a timestamp and metadata-only audit event. Backups cover every active managed slot and identify slots without returning values. See [Credential slot operations](../runbooks/CREDENTIAL_SLOT_OPERATIONS.md) and the [credential slot schema](../reference/schemas/credential-slot.schema.json).

See [Environment variables](../reference/environment-variables.md) and [schemas](../reference/schemas/).
