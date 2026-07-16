# ADR 0013: Versioned Credential Vault

## Status

Accepted.

## Context

The original encrypted credential format derived an AES key with a single SHA-256 pass over a user-provided passphrase. Rotation moved the active file before proving that the replacement could be committed safely.

## Decision

Encrypted credentials use a versioned schema with AES-256-GCM, authenticated protected metadata, random 128-bit salts, and Argon2id key derivation. The default Argon2id parameters are 64 MiB memory, three passes, one lane, and a 32-byte output. PBKDF2-SHA-256 with 600,000 iterations is the documented fallback when Argon2id is unavailable.

Rotation writes and validates a replacement artifact before archiving and replacing the active credential. Rotation history is encrypted and bounded to five versions per credential. Schema-v1 encrypted credentials remain readable so they can be rotated into schema v2.

The master passphrase remains external to the workspace and must be supplied through `AI_WORKSPACE_CREDENTIAL_KEY` from an approved operating-system credential store or secret manager.

## Consequences

- Offline passphrase attacks are substantially more expensive.
- Credential identity and version metadata are authenticated and encrypted.
- Rotation interruption can restore the prior artifact.
- Existing schema-v1 credentials require rotation to receive the stronger KDF.
