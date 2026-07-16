# Enterprise Reliability and Security Foundation

Forgevena E1 introduces three stable boundaries:

1. The CLI parses global safety options and renders structured operation envelopes independently from command execution.
2. Application context owns shared infrastructure dependencies such as the state engine.
3. Every managed registry uses one atomic, locked, checksummed state engine while encrypted secrets remain in the credential vault.

## State Lifecycle

Managed writes acquire a per-document lock, validate the next document, write and flush a temporary file, rename it atomically, and persist a checksum. Multi-document operations create a prepared journal and restore backups if any write fails.

Use:

```powershell
forgevena state validate
forgevena state snapshot --apply
forgevena state history
forgevena state repair --dry-run
```

## Vault Lifecycle

Encrypted credential values are never accepted as command-line arguments or returned in status output. Configure the vault master key outside the repository, then use the masked credential workflow. Rotation preserves bounded encrypted history.

```powershell
$env:AI_WORKSPACE_CREDENTIAL_KEY = "value-from-approved-secret-store"
forgevena credentials configure openai --apply
forgevena vault audit
forgevena vault rotate openai --apply
```

## Compatibility

The `forgevena` and `ai-workspace` commands remain compatible during 1.x. `.ai-workspace/` paths are unchanged, existing files remain additive-only, and legacy encrypted credentials can be read before rotation.
