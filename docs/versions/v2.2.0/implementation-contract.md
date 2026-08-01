# v2.2.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Cross-registry namespaces:** dependencies resolve against the registry identity pinned by the publisher or lockfile. A namespace on another registry is distinct unless an explicit signed federation mapping exists. Public fallback is never implicit, preventing dependency confusion.
- **Private transparency:** private registries maintain the same append-only signed publication, revocation, ownership-transfer, and audit records as public registries. Disclosure remains organization-scoped; auditors receive policy-approved proofs and redacted evidence, not private package contents unless separately authorized.

## Federation and Mirroring

Registry sources declare identity, trust roots, namespace policy, priority, mirror relationship, authentication reference, residency, retention, and availability. Federation exchanges signed metadata and immutable blobs; it does not merge authority. Mirrors preserve origin signatures and record replication checkpoints.

Resolution uses lockfile origin first, then explicit organization mappings, then configured source order. Unavailable sources do not trigger unapproved fallback. Conflicting signed records enter quarantine and preserve the last valid view. Revocations propagate as signed events with severity, effective time, reason, affected releases, safe alternatives, and emergency behavior.

## Air-Gap and Continuity

Air-gap bundles contain packages, metadata, trust roots, revocations, compatibility evidence, lockfiles, checksums, and an import manifest. Promotion across zones records exporter, importer, approvals, scan evidence, and content identity. Offline systems can reject expired or revoked evidence according to policy without contacting public infrastructure.

Continuity supports regional mirrors, encrypted backups, registry reconstruction from transparency records and immutable blobs, and last-known-good read-only service. RPO and RTO are organization-configurable with documented enterprise defaults of 15 minutes and four hours.

## Verification

Tests cover partition, stale mirror, split brain, replay, equivocation, namespace collision, revoked keys, malicious upstream, air-gap tampering, partial replication, origin outage, and reconstruction. Federation health exposes freshness and divergence without leaking private metadata. `v2.2.0` is done when fail-closed trust, deterministic mirror behavior, revocation, offline promotion, and disaster recovery are independently reproducible.

## Scope, Ownership, Inputs, and Outputs

ForgeRegistry Federation Maintainers own `federated-registry-sources` and `airgap-revocation-continuity`. Inputs are signed registry descriptors, trust roots, mirror policy, immutable package metadata, revocations, transparency checkpoints, replication cursors, and approved air-gap bundles. Outputs are deterministic source plans, replicated objects, divergence records, revocation views, continuity snapshots, and verified promotion receipts. Registry state is `trusted`, `syncing`, `current`, `stale`, `partitioned`, `diverged`, `revoked`, or `read-only`.

## Security, Permissions, and Data Flow

Federation permission is source-specific and deny-by-default. Data flow exposes only namespace and package metadata permitted by registry policy; private existence, tenant identity, access token, and residency metadata remain confidential. Trust roots, namespace delegation, mirror use, and air-gap promotion require human approval. Retention preserves transparency and revocation history permanently while private cache retention follows organization policy. A mirror cannot broaden upstream authority or replace origin identity.

## Failure, Recovery, Migration, and Rollback

Partition and equivocation do not trigger silent last-writer-wins behavior. Recovery compares signed checkpoints, quarantines divergent objects, and requires an explicit resolution plan. Migration keeps prior source descriptors and trust roots until the new federation view is verified. Rollback returns to a pinned checkpoint and last-known-good source set; roll-forward applies resolved checkpoints monotonically. Emergency revocation has an independent kill switch, and origin outage degrades to verified read-only service when policy permits.

## Service Objectives and Capacity

Replication and mirror operators declare a transfer, storage, and compute cost budget before enabling a source.

Federation freshness has a service level objective of 5 minutes for connected registries, revocation propagation below 60 seconds for online mirrors, RPO of 15 minutes, and RTO of 4 hours. A mirror supports 1,000,000 metadata records and 100 concurrent synchronization streams with bounded backpressure. Air-gap verification processes 1 GiB within 5 minutes on reference hardware. Health reports checkpoint age, divergence, replication lag, trust-root expiry, revocation age, and continuity readiness.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover split brain, replay, equivocation, namespace collision, malicious upstream, revoked keys, stale mirrors, partial replication, air-gap tampering, origin outage, and full reconstruction. Acceptance evidence includes independent checkpoint verification, revocation latency, deterministic mirror comparison, offline promotion receipts, disaster-recovery exercise, and privacy review. The evidence owner is ForgeRegistry Federation Maintainers; trust, revocation, and transparency evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer registry authority, namespace delegation, conflict winner, revocation exception, or data-sharing permission. Invalid or stale trust, unresolved divergence, missing checkpoints, and private-metadata ambiguity must fail closed. It may propose synchronization or recovery commands, but external transfer, trust-root change, promotion, and destructive reconstruction require human approval.
