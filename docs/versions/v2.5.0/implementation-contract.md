# v2.5.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Organization distributions:** distributions are immutable signed manifests with semantic version, support channel, included lockfiles, policy bundle, compatibility window, release notes, migration, rollback, and end-of-life. Organizations may maintain LTS channels with explicit backport and evidence policy.
- **Separation of duties:** publisher approval, trust-root changes, policy exceptions, production promotion, emergency revocation reversal, and destructive recovery require a requester and independent approver. Tier-3 production promotion additionally requires security or compliance approval according to policy.

## Organization Ecosystem

Private catalogs, approved package sets, policy and compliance packs, shared providers, organization templates, and distributions are portable signed objects. Promotion states are `candidate`, `validated`, `security-reviewed`, `approved`, `staged`, `production`, `deprecated`, and `retired`. Each transition records approvers, evidence, expiry, affected environments, and rollback.

Delegated administrators receive resource-scoped roles and cannot modify their own authority. Deny-overrides policy applies through every CLI, API, dashboard, registry, and automation path. Inventory records package identity, scope, ownership, health, evidence freshness, and policy—not source content or secrets.

## Simulation and Impact

Policy simulation and dependency-impact preview run without mutation. They show affected projects, compatibility, permission changes, transitive dependencies, trust changes, migration requirements, downtime risk, and rollback. Approval history is immutable and exportable. Offline workflows use signed bundles and retain the same separation-of-duties evidence.

## Verification

Tests cover alternate-path bypass, self-approval, role escalation, tenant isolation, stale approvals, distribution drift, interrupted promotion, policy rollback, offline import, inventory privacy, and LTS migration. `v2.5.0` is done when organization bundles are portable, every external-effect boundary is enforced, promotion is recoverable, and audit evidence is complete.

## Scope, Ownership, Inputs, and Outputs

Every policy, approval, promotion, rollback, and compliance event is tenant-scoped, signed where required, and correlated by operation ID.

Enterprise Ecosystem Maintainers own `organization-catalog-approvals` and `controlled-capability-promotion`. Inputs are signed organization policy, principals, roles, catalog releases, package evidence, environment rules, approval requests, inventories, and promotion targets. Outputs are approved catalogs, policy decisions, promotion plans, signed organization distributions, dependency-impact reports, inventory summaries, compliance evidence, and immutable approval history. Promotion state is `proposed`, `simulated`, `waiting-approval`, `approved`, `staged`, `promoted`, `rejected`, `rolled-back`, or `expired`.

## Security, Permissions, and Data Flow

Permissions use tenant-scoped RBAC, separation of duties, deny-overrides policy, and explicit scope. Requesters cannot approve their own high-risk promotions. Data flow shares only approved package metadata and policy evidence; project inventory, private namespace, principal, and usage data follow minimization, retention, deletion, and residency rules. Human approval is required for policy changes, delegated administration, cross-environment promotion, compliance exceptions, private distribution export, and destructive rollback. Offline bundles retain the same signatures and approval chain.

## Failure, Recovery, Migration, and Rollback

Policy or approval failure blocks promotion without changing the target. Recovery validates signed journals, package digests, role assignments, and prior approvals before resuming. Migration keeps the previous organization bundle and generates a reversible precedence report. Rollback restores the last-known-good catalog and policy, while roll-forward applies a corrected immutable distribution. Kill switches stop promotions, delegated approvals, or external exports independently while preserving local simulation and audit access.

## Service Objectives and Capacity

Inventory, simulation, approval, and distribution services declare storage, compute, and transfer cost budgets before activation.

Policy simulation has a service level objective of p95 below 500 ms for 10,000 rules, dependency-impact preview below 5 seconds for 100,000 inventory edges, and approval-state propagation below 30 seconds online. The platform supports 10,000 projects and 1,000 pending approvals per organization with bounded queues. Offline distribution verification completes within 5 minutes per GiB. Health reports policy freshness, signer status, approval backlog, promotion drift, inventory age, and rollback readiness.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover self-approval, alternate-command bypass, role escalation, tenant confusion, stale approvals, policy conflicts, interrupted promotion, drift, offline tampering, privacy leakage, and LTS migration. Acceptance evidence includes policy decision traces, separation-of-duties tests, portable bundle verification, promotion rehearsal, rollback proof, inventory privacy review, and compliance export validation. The evidence owner is Enterprise Ecosystem Maintainers; policy, approval, promotion, and compliance evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer organization membership, role, approval, policy precedence, promotion target, exception, or compliance status. Ambiguous authority, stale approval, invalid signature, unresolved dependency impact, or tenant mismatch must fail closed. The agent may prepare simulations and plans, but human approval is mandatory before policy mutation, promotion, delegation, external export, or rollback.
