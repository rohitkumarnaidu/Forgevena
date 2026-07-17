# Supply-Chain Threat Model

## Assets

- Source, release archives, package metadata, templates, plugins, catalogs, policy bundles, credentials, and provenance evidence.

## Threats and controls

| Threat | Control |
|---|---|
| Dependency substitution or tampering | Committed npm lockfile, dependency audit, SBOM, integrity metadata, and update review. |
| Modified release artifact | SHA-256 checksums, immutable release assets, signed tags, and generated provenance. |
| Compromised publication workflow | Protected environments, least-privilege permissions, OIDC provenance, and owner approval. |
| Secret committed to source | Credential-shaped file rejection, content scanning, push protection, and secret-safe diagnostics. |
| Malicious plugin or template | Trusted publishers, signatures, declared permissions, process isolation, immutable cache, and deny-overrides policy. |
| Provenance forgery | Hosted CI identity, OIDC-backed npm provenance, checksum reconciliation, and in-toto statement validation. |

Release gates fail closed when required controls or evidence are missing. Account-owned signing, hosted CI attestations, and publication remain explicit maintainer actions.
