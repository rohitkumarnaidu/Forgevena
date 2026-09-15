# ADR 0023: Named Provider Credential Slots

- **Status:** Accepted
- **Date:** 2026-08-17

## Decision

Forgevena supports multiple managed credential slots per provider. `primary`, `personal`, `work`, and `staging` are suggested identifiers; custom lower-case, hyphenated identifiers are permitted. The active slot is explicit metadata and only its value is resolved after any process-environment override.

`primary` continues using the existing 1.x storage paths. Additional slots are provider-scoped ignored files. Slot metadata contains identifiers, storage mode, lifecycle timestamps, state, and a bounded audit trail only; it never contains credential material.

Removing a managed slot quarantines it for 30 days. Recovery validates format and never overwrites an active slot. When an active slot has alternatives, removal requires an explicit replacement selection. Process-environment and legacy `.env` credentials remain owned by their external secret systems and cannot be managed through slot operations.

## Consequences

- Existing CLI commands keep targeting `primary` and remain compatible.
- Operators can rotate, isolate, and recover personal, work, and staging keys without exposing values.
- The dashboard can manage slots safely through its loopback-only authenticated API.
- Automatic quarantine cleanup reduces indefinite secret retention while retaining a bounded recovery path.
