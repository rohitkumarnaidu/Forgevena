# v2.4.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Official publishers:** official status requires verified control of the project domain or repository, a hardware- or service-protected signing key, two recovery contacts, published security and support policies, reproducible identity evidence, and periodic revalidation. Verification proves identity and ownership, not package safety.
- **Abandoned critical packages:** opt-in escrow stores encrypted recovery material or reproducible build inputs under quorum control. Transfer requires demonstrated abandonment, vulnerability or continuity impact, maintainer outreach, public notice, dispute period, independent approval, and a signed succession release. Existing signatures remain visible.

## Publisher Lifecycle and SDK

Publisher states are `unverified`, `verified`, `restricted`, `suspended`, `recovering`, and `retired`. Package publication states are `draft`, `validated`, `signed`, `staged`, `submitted`, `published`, `deprecated`, `withdrawn`, `revoked`, and `superseded`. Immutable published versions are never replaced.

The SDK defines typed builders for capability, provider, plugin, MCP, workflow, template, skill, UI extension, and host adapter packages. Capability Studio profiles share schema, validation, permission preview, security review, testing, evaluation, documentation, packaging, signing, compatibility export, and rollback guidance.

## Publication and Security

Validation checks schemas, namespaces, dependencies, compatibility, permissions, licenses, secrets, malware, path safety, lifecycle code, SBOM, provenance, signatures, documentation, examples, tests, and support metadata. Executable hooks are denied unless sandboxed, scoped, bounded, policy-approved, and consented.

Withdrawal stops new resolution but preserves transparency and existing lockfile verification. Revocation records severity, reason, evidence authority, effective time, remediation, and appeal. Ownership recovery, disputes, vulnerability reports, and emergency actions are fully audited.

## Verification

Tests cover malicious archives, forged identity, key compromise, dependency confusion, unsafe hooks, staged rollback, interrupted publication, duplicate versions, ownership transfer, escrow quorum, withdrawal, revocation, and appeal. `v2.4.0` is done when SDK fixtures are deterministic, publication is signed and staged, malicious packages remain isolated, and publisher recovery cannot rewrite history.

## Scope, Ownership, Inputs, and Outputs

Every validation, signing, publication, ownership, vulnerability, and revocation event carries the namespace, release digest, actor, policy decision, and operation ID.

Publisher Platform Maintainers own `capability-studio-sdk` and `governed-publisher-lifecycle`. Inputs are publisher identity, canonical capability definitions, package assets, schemas, permissions, compatibility declarations, tests, documentation, licenses, SBOM, provenance, signatures, and publication policy. Outputs are validated packages, staged releases, immutable publication receipts, deprecation or withdrawal records, revocations, SDK fixtures, and audit evidence. Publication state is `draft`, `validated`, `signed`, `staged`, `published`, `deprecated`, `withdrawn`, or `revoked`.

## Security, Permissions, and Data Flow

Publisher permission is namespace-scoped, role-separated, and cannot be delegated through package content. Data flow places all uploads in quarantine before validation and exposes only approved public metadata after publication. Private drafts, recovery material, vulnerability reports, and identity evidence follow explicit retention and residency policy. Human approval is required for initial namespace ownership, publication, ownership transfer, recovery, withdrawal, revocation, and executable-hook exceptions. Raw credentials never enter packages or SDK output.

## Failure, Recovery, Migration, and Rollback

Failed validation or signing leaves the release unpublished and immutable staging evidence intact. Recovery uses verified identity and multi-party or policy-defined controls without changing prior history. Migration preserves old schemas and published packages while producing explicit compatibility reports. Rollback withdraws a staged release or restores publisher tooling; a published immutable version is never rewritten. Roll-forward creates a new version or corrective metadata record. Emergency kill switches stop publication and quarantine suspicious namespaces while preserving verification.

## Service Objectives and Capacity

Validation has a service level objective of p95 below 60 seconds for a 500 MiB package, staging acknowledgement below 5 seconds after upload verification, and revocation publication below 60 seconds. Upload capacity is 2 GiB per package with bounded decompression and 10,000 files by default. Malware and dependency analysis have explicit timeout and cost budgets and report `healthy`, `degraded`, or `blocked` rather than silently skipping checks.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover forged identity, malicious archives, secret leakage, unsafe hooks, duplicate versions, interrupted publication, key compromise, ownership transfer, escrow quorum, deprecation, withdrawal, revocation, disclosure, and appeal. Acceptance evidence includes deterministic SDK fixtures, signing vectors, quarantine results, publication receipts, identity-recovery exercise, malicious-package isolation, and rollback proof. The evidence owner is Publisher Platform Maintainers; publication, ownership, revocation, and vulnerability evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer publisher identity, namespace ownership, permission, license, compatibility, signing authority, or publication approval. Missing evidence, unsafe hooks, invalid signatures, unresolved vulnerabilities, and ownership ambiguity must fail closed. The agent may generate validation and preview artifacts, but publication, withdrawal, revocation, recovery, and ownership transfer require human approval.
