# Forgevena 1.3.0

Forgevena 1.3.0 certifies the local reliability, state, and credential-vault foundation while preserving every public 1.x compatibility and additive-safety guarantee.

## Highlights

- The CLI is decomposed into routed handlers, injected application services, global option parsing, consent, rendering, execution, and stable error translation.
- The state engine provides exclusive locking, stale-lock recovery, atomic checksummed writes, transaction journals, crash recovery, snapshots, repair, migration, rollback, and bounded history.
- The encrypted vault supports AES-256-GCM, Argon2id with PBKDF2 fallback, authenticated metadata, transactional rotation, validated recovery, legacy migration, and bounded encrypted history.
- Reliability evidence covers 32 concurrent writers, 1,000 deterministic corruption cases, disk-full and permission failures, interrupted writes, and fail-closed recovery.
- Quality gates enforce 90% line, 85% branch, and 90% function coverage, stricter state/vault thresholds, and mutation testing across state, vault, consent, policy, and rollback boundaries.
- Warm CLI startup and ordinary state reads have enforced performance budgets, and generated documentation uses hash-based ownership to prevent accidental overwrites.
- Migration and rollback fixtures verify compatibility with published 1.1 and 1.2 workspace state.
- The unused FFmpeg installer dependency is removed from the runtime package.

## Compatibility

- Existing `.ai-workspace` paths remain unchanged.
- Existing CLI commands, aliases, structured envelopes, and exit-code contracts remain compatible.
- `forgevena` and `ai-workspace` remain supported throughout 1.x.
- Project initialization remains additive and never overwrites existing files.
- npm supports x64 and arm64 on Windows, Linux/WSL, and macOS; standalone release executables target x64.

## Install

```powershell
npm install --global forgevena@1.3.0
forgevena version
forgevena doctor
```

Verify downloaded native assets against `RELEASE_SHA256SUMS` before execution.
