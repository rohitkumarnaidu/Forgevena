# v2.0.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Synchronizable data:** policy may allow organization IDs, workspace IDs, package and policy metadata, compatibility evidence, audit metadata, and encrypted configuration references. Source code, prompts, responses, raw secrets, vault material, and unrestricted local paths never synchronize. Every field has an explicit classification, purpose, retention, residency, and deletion rule.
- **Consistency:** local workspaces remain authoritative for local execution. Control-plane state uses version vectors and immutable operation records. Nonconflicting changes merge deterministically; policy, trust-root, identity, and destructive conflicts require human resolution. Offline clients continue under last-valid policy subject to expiry and cannot broaden authority.

## Architecture and Tenancy

The control plane separates identity, authorization, policy distribution, encrypted synchronization, inventory, audit retention, and administration. Every request carries tenant, principal, operation ID, authorization context, and schema version. Tenant context is derived from authenticated claims and never accepted solely from client input.

SSO uses OIDC with documented issuer, audience, nonce, PKCE, session, refresh, logout, and key-rotation rules. RBAC uses deny-overrides policy and resource-scoped roles. Service identities are short-lived and least-privileged. Data is encrypted in transit and at rest; synchronization payloads additionally use workspace or organization keys with rotation metadata.

## Synchronization and Recovery

Sync states are `offline`, `discovering`, `authenticated`, `planning`, `uploading`, `downloading`, `conflicted`, `committing`, `healthy`, and `degraded`. Every plan previews data classes and destination. Interrupted transfers resume by immutable chunk hash. Corrupt or unauthorized payloads quarantine without changing local state.

Conflict records include competing versions, origin, policy impact, safe choices, and rollback. Key rotation supports overlap, re-encryption progress, revocation, and recovery. Backups are encrypted, tenant-scoped, tested, and governed by RPO/RTO. Control-plane outage never disables local read-only inspection or previously authorized offline operations.

## Migration and Operations

Migration from 1.x is opt-in, preview-first, exports a local backup, registers only approved metadata, and can disconnect cleanly. No account is required for local operation. Service objectives define 99.9% control-plane availability, no cross-tenant disclosure, RPO of 15 minutes, RTO of four hours, and deterministic offline behavior; these are implementation targets requiring future evidence.

Tests cover tenant isolation, confused deputy attacks, token misuse, policy rollback, sync conflicts, offline expiry, clock skew, key rotation, partial transfer, corruption, deletion, disaster recovery, and 1.x disconnect. `v2.0.0` is done only after independent threat review, tenant-isolation evidence, migration rehearsal, outage exercise, and local-only compatibility pass.

## Scope, Ownership, Inputs, and Outputs

Every identity, policy, synchronization, conflict, and recovery event is tenant-scoped and schema-versioned.

Control Plane Maintainers own `self-hosted-control-plane` and `encrypted-conflict-aware-sync`. Inputs are signed organization policy, principal identity claims, tenant-scoped metadata, encrypted synchronization changes, device state, revocation records, and explicit enrollment consent. Outputs are policy distributions, conflict records, encrypted sync acknowledgements, fleet metadata, audit exports, and disaster-recovery evidence. Tenant and device state transitions are versioned, append-only where required, and correlated through stable operation IDs.

## Security, Permissions, and Data Flow

SSO/OIDC authentication maps to tenant-scoped RBAC with deny-overrides policy; no identity claim alone grants workspace authority. Every data flow is encrypted in transit and at rest, tenant-keyed, classified, residency-bound, and minimized to approved metadata. Cross-tenant reads, writes, logs, caches, backups, and support access are prohibited. Retention and deletion follow signed organization policy and legal hold. Human approval is required for enrollment, trust-root changes, destructive fleet actions, key recovery, policy promotion, and any managed-service transfer.

## Failure, Recovery, Migration, and Rollback

Synchronization failure preserves local operation and records a resolvable conflict rather than choosing silently. Recovery validates journals, signatures, tenant ownership, and sequence before replay. Migration from 1.x is preview-first, backed up, reversible, and disconnectable. Rollback restores the previous compatible policy and synchronization contract; roll-forward resolves schema or key changes without rewriting history. Key compromise activates revocation and rotation kill switches, while control-plane outage preserves authorized offline work.

## Service Objectives and Capacity

Each tenant declares a storage, transfer, and compute cost budget; exceeding it throttles optional synchronization instead of dropping evidence.

The control plane has a service level objective of 99.9% monthly availability, synchronization acknowledgement p95 below 2 seconds for 1 MiB changes, RPO of 15 minutes, and RTO of 4 hours. Tenant isolation must produce zero cross-tenant disclosures. Initial capacity supports 10,000 workspaces and 100 concurrent synchronizations per tenant, with backpressure instead of unbounded queues. Health reports identity, policy, sync, key, backup, conflict, and regional status without exposing protected content.

## Verification and Acceptance Evidence

The required suite includes unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover confused deputies, forged tokens, tenant-key misuse, replay, clock skew, split brain, key compromise, backup corruption, partial transfer, regional outage, deletion, offline expiry, and disconnect. Acceptance evidence includes an independent threat review, tenant-isolation report, cryptographic protocol review, migration rehearsal, disaster-recovery exercise, SLO load test, and offline continuity proof. The evidence owner is Control Plane Maintainers; security and release evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer tenant, principal, permission, trust root, conflict winner, residency, or deletion policy. Ambiguous identity, stale policy, invalid signature, unavailable key, or cross-tenant reference must fail closed. It may generate a preview and conflict explanation, but human approval is mandatory before enrollment, key recovery, policy promotion, destructive repair, or external synchronization.
