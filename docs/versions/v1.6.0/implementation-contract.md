# v1.6.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Inheritance:** deterministic inheritance permits one ordered parent chain plus explicit named mixins. Cycles, duplicate target paths with unequal content, ambiguous variable ownership, and conflicting lifecycle hooks are rejected. Child overrides require the parent manifest to mark the field or asset overridable.
- **Abandoned publishers:** immutable releases remain installable while trust evidence is valid. New publication stops. A critical package may transfer only through the publisher-recovery process with public notice, signature-chain evidence, a 30-day dispute window, and an organization opt-in; namespace takeover is prohibited.

## Package and Catalog Contract

A template package declares package and schema version, publisher, compatibility, parents, mixins, variables, assets, content hashes, lockfiles, required capabilities, generated-path ownership, tests, signatures, license, support lifecycle, and deprecation. Assets are immutable and content-addressed. Rendering has `resolve`, `verify`, `plan`, `render-staging`, `validate`, `commit`, and `record-manifest` states.

Catalogs are signed ordered indexes of immutable package releases. Local catalogs are first-class. HTTPS catalogs require consent, TLS, signature verification, bounded download size, cache checksums, and offline verification. A stale cache may support pinned installs when policy allows but cannot produce a fresh compatibility claim.

## Additive Safety and Drift

Existing files are always skipped. Template ownership begins only for files created by the committed operation and records content hashes. Rollback removes only unchanged owned files. Drift reports `unchanged`, `modified`, `missing`, `superseded`, or `unmanaged`; remediation remains preview-only and never overwrites modified files.

## Native Distribution

Homebrew, Winget, and Chocolatey metadata derives from one immutable release manifest. URLs reference versioned assets, hashes are verified, dependencies and uninstall behavior are explicit, and generated manifests pass channel validation. External moderation remains authoritative and is recorded as external evidence rather than implied approval.

## Verification and Operations

Golden tests cover every template on Windows, Ubuntu, and macOS, deterministic repeated generation, invalid inheritance, tampering, offline cache use, existing-file preservation, interrupted commit, drift, and rollback. Catalog health reports signature, freshness, mirror, and cache state without telemetry. `v1.6.0` is done when all packages and catalogs validate, generated lockfiles/Docker/CI/security/docs pass structural checks, and native install/verify/uninstall evidence is retained.

## Scope, Ownership, Inputs, and Outputs

Template and Distribution Maintainers own `versioned-template-packages` and `template-catalog-distribution`. Inputs are package manifests, variables, parent and mixin releases, policy, lockfiles, and target workspace facts. Outputs are a deterministic plan, staged assets, managed ownership manifest, validation report, distribution metadata, and stable conflicts. Render state and event transitions are the seven states defined above; only the commit state may create missing files.

## Security, Permissions, and Data Flow

Permissions cover catalog network access, package trust, target paths, executable hooks, and distribution publication. The data flow is source selection, quarantine, signature verification, dependency resolution, rendering to staging, validation, additive commit, and managed evidence. Template inputs and workspace metadata follow project retention; secrets and source content are never copied into catalogs. Human approval is required for network catalogs, unsigned packages, lifecycle hooks, publication, and any change outside managed ownership.

## Failure, Recovery, Migration, and Rollback

Failure handling rejects cycles, hash mismatches, conflicting paths, invalid variables, stale trust, and partial commits. Recovery resumes from the journal or removes unchanged staged assets. Migration preserves prior lockfiles and ownership manifests. Rollback removes only unchanged managed files; roll-forward selects a new immutable template release and reports drift without overwriting user content.

## Service Objectives and Capacity

The service level objective is deterministic planning below 500 ms p95 for 1,000 assets and bounded generation below 60 seconds for the enterprise reference template. Default capacity is 10,000 files and 2 GiB staged output; larger plans require explicit policy. The cost budget for remote catalogs is download-size and request-count based. Health reports catalog freshness, signature trust, cache integrity, and renderer readiness separately.

## Verification and Acceptance Evidence

Required coverage includes unit tests, package-schema contract tests, catalog integration tests, CLI end-to-end tests, negative inheritance tests, adversarial archive and path tests, performance tests, migration tests, rollback tests, and a recovery test for interrupted commit. Acceptance evidence retains golden-tree hashes, OS and runtime versions, deterministic rerun results, preserved-file proof, and channel validation. The evidence owner is Template and Distribution Maintainers, with retention for every supported template release.

## AI-Agent Implementation Rules

An AI coding agent must treat the package manifest and managed ownership record as authoritative and must not infer overwrite permission, lifecycle-hook safety, or catalog trust. It must fail closed on ambiguous inheritance, unequal duplicate paths, invalid signatures, or unsupported channel metadata. Human approval remains required for network acquisition, hooks, publication, and release promotion.
