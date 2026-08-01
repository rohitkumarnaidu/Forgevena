# v2.1.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Trust roots:** the distribution includes only Forgevena release keys and schema roots needed to verify official bootstrap metadata. Package-publisher and organization roots are explicitly added, scoped, reviewable, revocable, and exportable. No remote registry may silently add trust.
- **Namespace disputes:** namespace ownership is proven by registry account identity plus signed publisher keys. Disputes freeze new releases without removing installed immutable artifacts. Resolution follows evidence review, appeal, public decision metadata, and signed ownership transfer; dependency substitution is prohibited.

## Protocol and Package Model

`capability-package/v1` separates capability definitions, package manifest, immutable release, installation, configuration, activation, run, and evidence. A release includes namespace/name/version, capability exports, dependencies, peers, conflicts, platform compatibility, permissions, content hashes, signatures, provenance, SBOM, license, support, maturity, and deprecation.

Content storage is addressed by SHA-256 digest. Registry metadata references immutable blobs; publishing an existing version with different content is rejected. Resolver inputs are roots, constraints, scopes, policy, platform, trust, and lock state. Output is one deterministic graph, lockfile, explanation, and conflict set. Tie-breaking is specified and independent of network ordering.

## Local Registry and Installation

Local registries work fully offline. Import verifies archive structure, sizes, hashes, signatures, namespace, dependencies, permissions, and policy before adding content. Installation states are `resolved`, `verified`, `planned`, `staged`, `activated`, `healthy`, `degraded`, `rolling-back`, and `removed`. Existing project files remain additive-only; package-owned assets record hashes.

Cache corruption is quarantined and reacquired only with consent for network access. Lockfiles pin package versions, blob hashes, registry identities, compatibility evidence, and resolver version. Export bundles include all blobs, metadata, trust references, lockfiles, checksums, and verification instructions.

## Verification and Operations

Tests cover deterministic resolution, cycles, conflicts, peer constraints, dependency confusion, namespace spoofing, tampering, zip bombs, path traversal, corrupt cache, lockfile drift, offline import/export, interrupted activation, and rollback. Ordinary local resolution targets p95 below 200 ms for 1,000 candidates. `v2.1.0` is done when independent implementations produce identical lockfiles and last-known-good recovery works without network access.

## Scope, Ownership, Inputs, and Outputs

ForgeRegistry Maintainers own `canonical-capability-package` and `deterministic-local-registry`. Inputs are immutable package releases, manifests, namespaces, dependency constraints, trust roots, policy, compatibility evidence, and installation scope. Outputs are resolved graphs, lockfiles, verified content-addressed blobs, installation plans, ownership manifests, and audit evidence. Package state is `quarantined`, `verified`, `resolved`, `staged`, `active`, `degraded`, `revoked`, or `removed`; every state event identifies registry, namespace, version, digest, resolver version, and operation.

## Security, Permissions, and Data Flow

Package permission declarations are data, never authority; Core policy and human approval govern activation. Import data flow remains in quarantine until path safety, size, hash, signature, namespace, dependency, license, provenance, SBOM, and compatibility checks pass. Registry metadata retention is separate from package blob retention. Deletion removes unreferenced blobs only after lockfile and rollback reachability analysis. Private namespace, source, and residency metadata cannot leak through errors, logs, cache keys, or public resolution requests.

## Failure, Recovery, Migration, and Rollback

Resolution failure returns a deterministic conflict set and makes no installation changes. Recovery validates journals and reconstructs indexes from immutable blobs and signed metadata. Migration pins the prior resolver and lockfile format, creates a reversible translation, and keeps the original. Rollback activates the last-known-good verified graph and removes only unchanged package-owned assets; roll-forward resolves against the new contract after explicit preview. Corrupt blobs are quarantined, revoked packages remain inspectable, and a kill switch disables external registries without disabling local verification.

## Service Objectives and Capacity

Local resolution has a service level objective of p95 below 200 ms for 1,000 candidates and lockfile verification below 1 second for 10,000 nodes. The cache supports 100,000 blobs and applies configured GiB capacity with deterministic least-recently-used eviction that preserves pinned rollback content. Offline import has a cost budget of 30 seconds per GiB before additional confirmation. Health reports trust-root freshness, cache integrity, namespace conflicts, resolver drift, revocations, and last-known-good availability.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover cycles, peer conflicts, dependency confusion, namespace spoofing, tampering, zip bombs, traversal, duplicate content, corrupt cache, interrupted activation, offline bundles, and unknown capability types. Acceptance evidence includes cross-implementation lockfile equality, signature vectors, resolver corpus results, cache recovery, additive-file proof, and offline rollback. The evidence owner is ForgeRegistry Maintainers; release, namespace, signature, and revocation evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must implement the canonical schema and deterministic resolver rules exactly. It must not infer namespace ownership, trust, compatibility, permission, conflict preference, or activation consent. Unknown schemas, missing hashes, invalid signatures, unresolved graphs, or unmanaged paths must fail closed. Human approval is required before network acquisition, activation, replacement, or deletion.
