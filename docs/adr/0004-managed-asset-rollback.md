# ADR 0004: Managed Asset Rollback

## Decision

Each applied bootstrap operation records its created files and content hashes. Rollback may remove only unchanged, manifest-owned assets after explicit confirmation.

## Consequences

Modified, missing, existing, and unmanaged files are preserved and reported. Rollback never attempts to reverse external installations.
