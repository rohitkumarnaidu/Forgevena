# Phase 6: Production Distribution

## Scope

Phase 6 hardens distribution without changing the frozen platform architecture.

1. Cross-platform npm packaging and compatibility verification.
2. Release provenance, checksums, and CI release gates.
3. Signed declarative plugin distribution using an explicit trust store.
4. Preparation-only cloud targets with provider-specific credentials, validation, additive blueprints, and consent controls.
5. Optional managed team policy without storing organization secrets in projects.

## Acceptance Criteria

- Package contents are explicit and contain no local state, credentials, caches, or backups.
- Node and operating-system compatibility are machine-readable and tested.
- Release checks run tests, package inspection, and secret-pattern checks.
- Plugin signatures are verified before trusted installation; unsigned plugins remain untrusted.
- Every network, provider, and cloud action remains preview-first and consent-gated.

## Architecture Impact

No new platform layer is introduced. Release verification uses the existing CLI, plugin validation extends the existing plugin lifecycle, and cloud additions use the current cloud command boundary.

## Completion Evidence

- The npm package uses an explicit allowlist and declares Windows, Linux, macOS, x64, and arm64 compatibility.
- `npm run release:verify` validates package metadata and forbidden paths.
- Release CI runs on Windows, Linux, and macOS with supported Node.js versions.
- Actual `npm pack --dry-run` inspection confirms local secrets, caches, backups, logs, registries, and tests are excluded.
- Remote plugins require Ed25519 signatures from public keys explicitly added through the preview-first `plugins trust` command.
- Private signing keys are never accepted or stored; plugin executable code remains prohibited.
- The complete automated suite passes with 75 tests.

## Governed Follow-up

Managed team policy requires approved organization identity, tenancy, authentication, data-residency, administration, and ownership requirements. The local project platform does not invent organization-wide authority or silently connect to enterprise identity systems.
