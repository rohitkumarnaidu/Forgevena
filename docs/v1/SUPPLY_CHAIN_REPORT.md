# Supply Chain Report — 1.0.0

## Controls

- Package allowlist in `package.json`; no runtime or development npm dependencies.
- Reproducible `npm pack` verification and SHA-256 release checksum.
- Hosted Windows/Linux/macOS CI and Node 20/22 matrix.
- GitHub Actions use official checkout and setup-node actions.
- Declarative plugins enforce allowed permissions, integrity, and optional Ed25519 publisher trust.
- External installers and cloud commands are previewed and consent-gated.
- Generated templates include Dependabot and dependency-audit workflows where applicable.

## Residual risk

Generated project dependencies, external CLIs, container base images, and cloud services remain upstream supply-chain dependencies. Operators must review lock files, image digests, advisories, and organizational allowlists before production use.

Result: **Pass with operator-managed upstream risk**.
