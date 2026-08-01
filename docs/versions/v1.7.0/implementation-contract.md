# v1.7.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Principal-key recovery:** signing keys rotate through a signed succession statement containing old and new key IDs, validity window, reason, and recovery contacts. Lost-key recovery requires a preconfigured quorum of organization recovery principals. Without quorum, the bundle remains readable but new trusted policy cannot be issued; no silent key replacement is allowed.
- **Compliance packs:** packs provide control mappings and evidence requirements only. They are labelled `guidance`, `assessed`, or `externally-certified`; Forgevena never claims legal compliance or certification without dated independent evidence.

## Policy Model

Bundles contain organization, principals, roles, permissions, resource selectors, approved providers/plugins/templates/skills/workflows, capability rules, overlays, signatures, validity, and schema version. Evaluation order is Constitution, organization, workspace, project, host, package, then session. Deny overrides allow; lower scopes may only restrict.

`PolicyEngine` owns deterministic evaluation; `PrincipalStore` owns public identities; the vault owns private keys; `ApprovalService` owns separation-of-duties records; `ComplianceReporter` maps decisions to controls without exposing restricted data. Decisions return allow/deny, matched rules, precedence explanation, evidence freshness, operation ID, and remediation guidance.

## Approvals, Audit, and Recovery

Unsigned, unapproved, privilege-expanding, trust-root, publication, deployment, billing, and destructive recovery operations require explicit approval. Requester and approver must differ for Tier-3 operations. Audit exports are append-only, checksum-linked, metadata-only, signed, and independently verifiable.

Import validates schema, signatures, ownership, validity, overlays, and lockout risk before activation. Activation is transactional and retains the previous bundle. Emergency rollback restores the last valid bundle but cannot override the Constitution. A break-glass policy is time-bounded, narrowly scoped, multi-approved, prominently audited, and cannot expose secrets or disable audit.

## Verification and Operations

Tests cover precedence, deny bypass through alternate commands, role cycles, expired signatures, key rotation, quorum recovery, overlay conflicts, approval separation, break-glass expiry, import corruption, rollback, and deterministic explanation. Policy evaluation targets p95 below 25 ms for 10,000 rules on reference CI hardware. `v1.7.0` is done when signed portable bundles, simulation, compliance reports, immutable audit verification, recovery exercises, and every external-effect boundary pass policy conformance.

## Scope, Ownership, Inputs, and Outputs

Governance and Policy Maintainers own `signed-organization-policy` and `policy-simulation-compliance`. Inputs are signed bundles, principal identities, resource facts, requested actions, evidence freshness, and scope overlays. Outputs are deterministic decisions, matched-rule explanations, approval requirements, compliance mappings, and audit events. Policy state and event transitions cover draft, validated, signed, staged, active, superseded, expired, revoked, and recovered bundles.

## Security, Permissions, and Data Flow

Permissions use deny-overrides evaluation and separation of duties. The data flow is request normalization, identity resolution, bundle verification, ordered overlay evaluation, approval evaluation, decision emission, and metadata-only audit. Policy metadata retention follows organization audit policy; private keys and restricted resource content remain in the vault or owning subsystem. Human approval is required for privilege expansion, trust-root changes, break-glass use, destructive recovery, and production policy activation.

## Failure, Recovery, Migration, and Rollback

Failure handling distinguishes invalid signatures, expired bundles, unknown principals, cycles, conflicts, lockout risk, and unavailable evidence. Recovery uses the last valid signed bundle and never creates authority. Migration previews schema and precedence changes before activation. Rollback restores the previous valid bundle; roll-forward issues a new signed version with explicit supersession and audit linkage.

## Service Objectives and Capacity

The service level objective is evaluation below 25 ms p95 for 10,000 rules and simulation below 2 seconds for 100 affected resources. Capacity supports 100,000 principals and 1,000 overlays without nondeterministic ordering. The cost budget limits compliance report size and evaluation work per request. Health reports signature, principal, overlay, approval, audit, and recovery readiness independently.

## Verification and Acceptance Evidence

Required coverage includes unit tests, policy-schema contract tests, approval integration tests, CLI end-to-end tests, negative precedence tests, adversarial bypass and escalation tests, performance tests, migration tests, rollback tests, and a recovery test for lost signing keys. Acceptance evidence retains signed fixtures, evaluator version, decision hashes, alternate-path results, quorum exercises, and limitations. The evidence owner is Governance and Policy Maintainers, with retention for the policy support and audit period.

## AI-Agent Implementation Rules

An AI coding agent must preserve deny-overrides ordering and must not infer principals, approvals, compliance, or missing policy intent. It must fail closed on invalid or expired trust, ambiguous precedence, unavailable audit, or unresolved lockout risk. Human approval remains required for every authority-changing operation and release promotion.
