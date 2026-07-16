# ADR 0012: Transactional Local State Engine

## Status

Accepted.

## Context

Forgevena previously allowed individual subsystems to read and write independent JSON documents directly. Concurrent processes, interrupted writes, and malformed documents could cause lost updates or silent state replacement.

## Decision

All managed operational state under `.ai-workspace/` uses the shared file state engine. The engine provides exclusive per-document locks, stale-lock recovery, atomic write-and-rename persistence, checksums, schema callbacks, transaction journals, snapshots, and interrupted-transaction recovery.

Existing paths remain unchanged. Documents without checksum sidecars remain readable for 1.x compatibility and receive checksums on their next managed write. Corrupt or checksum-mismatched documents fail closed instead of being interpreted as empty state.

Generated project assets, logs, encrypted credential artifacts, and user-owned files are not registry state and retain their specialized lifecycle controls.

## Consequences

- Concurrent updates are serialized.
- State corruption becomes visible and recoverable.
- Subsystems depend on the state interface rather than filesystem write details.
- State commands can validate, snapshot, inspect, and recover managed documents.
- Networked multi-host coordination remains outside the local engine and is deferred to a future optional control plane.
