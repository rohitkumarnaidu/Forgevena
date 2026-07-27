# Enterprise Reliability and Security Foundation

Forgevena E1 introduces three stable boundaries:

1. The CLI parses global safety options and renders structured operation envelopes independently from command execution.
2. Application context owns shared infrastructure dependencies such as the state engine.
3. Every managed registry uses one atomic, locked, checksum-verified state engine while encrypted secrets remain in the credential vault.

## State Lifecycle

Managed writes acquire a per-document lock, validate the next document, write and flush a temporary file, rename it atomically, and persist a checksum. Multi-document operations create a prepared journal and restore backups if any write fails.

Completed journals use bounded retention while prepared journals are never pruned. Recovery validates journal structure, workspace containment, operation identifiers, and expected backup paths before restoring any file. Missing or malformed recovery evidence fails closed. The test suite exercises 32 concurrent writers, stale locks, interrupted transactions, checksum corruption, disk-full failures, permission failures, and 1,000 deterministic corrupt journals.

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
forgevena vault migrate openai --apply --yes
```

Schema-v1 encrypted credentials are never decrypted during ordinary reads. `vault migrate` is the only compatibility path: it previews by default, requires explicit `--apply --yes` consent, preserves the original encrypted payload under `.credentials/legacy/`, and immediately writes an AES-256-GCM schema-v2 vault derived with Argon2id (PBKDF2-SHA-256 fallback).

The reliability mutation gate creates isolated temporary source copies and verifies that tests reject mutations to state checksums, workspace boundaries, journal recovery, schema validation, vault algorithms, vault schemas, protected metadata, authentication tags, consent boundaries, and managed rollback. The required score is 80% per safety domain.

## Quality Evidence

Run the local gates with:

```powershell
npm test
npm run test:coverage
npm run test:mutation
npm run benchmark
```

CI runs the mutation and performance gates independently from the operating-system compatibility matrix. Current local evidence is tracked in `docs/release/V1_3_IMPLEMENTATION_STATUS.md`.

## Compatibility

The `forgevena` and `ai-workspace` commands remain compatible during 1.x. `.ai-workspace/` paths are unchanged, existing files remain additive-only, and legacy encrypted credentials can be read before rotation.
