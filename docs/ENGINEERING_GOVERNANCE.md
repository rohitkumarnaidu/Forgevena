# Engineering Governance

This document operationalizes the binding [Platform Constitution](strategy/PLATFORM_CONSTITUTION.md). It governs maintainers, contributors, automation, agents, and releases.

## 1. Decision Authorities

- Maintainers approve release scope, maturity changes, waivers, deprecations, and architectural decisions.
- CODEOWNERS review security-sensitive and contract-sensitive changes.
- Feature owners supply evidence and remain accountable through post-release review.
- Automation verifies policy but never replaces required human approval for irreversible or external effects.

## 2. Evidence Funnel

Every idea moves through one lifecycle. Skipping stages requires an approved waiver.

| Stage | Required evidence | Exit condition |
| --- | --- | --- |
| Signal | User, incident, audit, ecosystem, or operational observation | Problem is recorded with source and owner. |
| Discovery | Users, value, alternatives, non-goals, risks, and success metric | Maintainer accepts or rejects further investment. |
| RFC | Architecture, security, privacy, accessibility, compatibility, operations, cost, and acceptance plan | Required reviewers approve implementation direction. |
| Incubation | Bounded prototype, fixtures, threat model, and learning report | Evidence supports a product experiment. |
| Experimental | Opt-in implementation, explicit limitations, telemetry-free metrics | Reliability and user-value thresholds justify preview. |
| Preview | Documented contract, migration direction, support owner, compatibility evidence | Stable gates pass. |
| Stable | Versioned contract, complete tests/docs/operations, support policy | Enterprise evidence may be pursued. |
| Enterprise Certified | Current cross-platform, security, privacy, accessibility, reliability, performance, support, and compatibility evidence | Certification remains current at each review. |
| Deprecated | Notice, replacement or rationale, migration, support window, and retirement date | Support window expires and migration evidence is reviewed. |
| Retired | Removal and archival evidence | References, packages, and support material agree. |

Opportunity documents do not authorize implementation or assign release versions. Promotion requires the evidence and approvals of the next stage.

## 3. Feature Intake

A proposal must use the [Feature Proposal Template](governance/FEATURE_PROPOSAL_TEMPLATE.md) and identify the problem, users, measurable value, alternatives, non-goals, owner, maturity, support level, maintenance cost, risks, metrics, and exit criteria. Intake is rejected when it duplicates existing responsibilities, weakens the constitution, lacks a measurable outcome, or adds a core abstraction without demonstrated need.

## 4. Review Thresholds

| Change | Required review |
| --- | --- |
| Documentation-only clarification | Maintainer review and documentation validation. |
| Backward-compatible implementation | Owner, tests, documentation, security and compatibility assessment. |
| Secrets, identity, policy, provider egress, plugin execution, update, or supply chain | Security review and threat model. |
| Public schema, command, state, package, or protocol | Compatibility report and migration analysis. |
| New core abstraction or trust-boundary change | RFC, threat model, benchmark plan, and approved ADR. |
| Breaking change | Major-version plan, migration tooling, rollback, and explicit maintainer approval. |

## 5. Definition of Ready

Work is ready only when:

1. The problem, users, value, alternatives, and non-goals are documented.
2. Owner, maturity target, support level, metrics, and review date are assigned.
3. Architecture, security, privacy, accessibility, performance, reliability, operations, compatibility, and maintenance impacts are assessed.
4. Acceptance evidence, tests, documentation, observability, incident response, migration, rollback, and deprecation needs are defined.
5. Dependencies and policy boundaries are understood.
6. Required RFC, ADR, and threat-model approvals exist.

## 6. Definition of Done

A significant capability is complete only when:

1. Approved scope and acceptance criteria are implemented without bypassing existing architecture.
2. Unit, integration, CLI, contract, security, and subsystem-specific tests pass.
3. Schemas, migrations, rollback, registry behavior, structured output, and compatibility are verified.
4. CLI help, examples, API references, website documentation, troubleshooting, and operational guidance are current.
5. Logging, metrics, health, diagnostics, redaction, and incident procedures are appropriate to the capability.
6. Security, privacy, accessibility, reliability, performance, sustainability, and maintenance costs are reviewed.
7. Open-source value, enterprise value, expected ROI, support owner, maturity, and next review are documented.
8. There are no unexplained TODOs, FIXMEs, stubs, skipped tests, stale evidence, or unsupported maturity claims.
9. A completed [Change Readiness Scorecard](governance/CHANGE_READINESS_SCORECARD.md) and matching JSON record are retained under `docs/evidence/changes/<change-id>/` for every significant change.

## 7. Release Governance

Every release follows the [Versioned Product Roadmap](strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md) and produces architecture, security, privacy, accessibility, performance, reliability, testing, documentation, developer-experience, open-source, enterprise-readiness, debt, and gap assessments. The canonical [Change Readiness Scorecard](governance/CHANGE_READINESS_SCORECARD.md) controls push, merge, and release readiness; the release scorecard extends it with channel and roadmap evidence rather than replacing its scoring rules. Installation, upgrade, rollback, uninstall, documentation, package channels, tags, assets, and version metadata must agree before closure.

Significant changes must retain both human-readable and machine-readable scorecards. A ready decision is invalid when its score is below the risk-tier threshold, an active domain is below its minimum, a mandatory blocker is triggered, mandatory evidence is absent, or a waiver is prohibited or expired. Hosted CI and required review are mandatory for merge readiness and cannot be inferred from local push evidence.

Published tags are immutable. A failed publication may be retried only when code and metadata are unchanged; otherwise use the next patch version.

## 8. Deprecation and Migration

Deprecation uses the [Deprecation Notice Template](governance/DEPRECATION_NOTICE_TEMPLATE.md), appears in CLI and documentation where applicable, provides migration and rollback guidance, and remains active for at least two minor releases unless a security emergency is approved. State and contract migrations are preview-first, tested against supported versions, and preserve recoverable backups.

## 9. Incident Governance

Security, data-loss, credential, policy-bypass, release-integrity, and destructive-operation incidents stop promotion. The owner preserves evidence, contains impact, communicates status, supplies recovery guidance, and completes a blameless post-incident review. Corrective actions enter the same evidence and debt systems as planned work.

## 10. Waivers

Waivers are exceptional, time-limited, and recorded in `docs/governance/waivers.json`. Each waiver requires an owner, affected requirement, justification, risk, compensating controls, approval, creation date, expiry date, and remediation issue. Expired waivers fail validation. Waivers cannot authorize secret exposure, silent overwrite, unconsented external effects, policy bypass, falsified evidence, or mutable release tags.

## 11. Technical Debt

Every release reports introduced, retired, and outstanding debt. Planned work reserves at least 15% of engineering capacity for reliability, security, test quality, documentation, dependency health, and maintainability unless a release scorecard records an approved temporary variance. Critical security, data-loss, or rollback debt blocks release; high debt requires an owner and dated remediation.

## 12. Architecture Rule

The 1.x platform architecture is frozen. A new core abstraction requires a demonstrated problem, evidence that existing contracts are insufficient, alternatives and trade-offs, security and compatibility plans, measurable acceptance, and an approved ADR. Elegance alone is not justification.

## 13. Enterprise Capability Governance

Capability-system work uses the canonical [Enterprise Capability System](architecture/ENTERPRISE_CAPABILITY_SYSTEM.md), [Host Adapter Strategy](architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md), and [Orchestration Strategy](architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md). Documentation does not authorize runtime implementation.

Before runtime work begins, the change requires an approved feature proposal, RFC, ADR, threat model, versioned schemas, compatibility and migration plan, rollback design, and readiness scorecard. Capability packages, host adapters, agent teams, orchestration, rules, knowledge and memory, builders, publishers, marketplaces, and registry distribution use their dedicated readiness profiles.

Risk defaults are:

- documentation-only capability changes: `tier-0`;
- declarative non-executable packages: `tier-1`;
- tools, connectors, providers, executable plugins, memory, and host adapters: `tier-2`;
- security rules, agent teams, dynamic orchestration, secrets, external mutation, registry trust, and control-plane changes: `tier-3`.

Tier-3 security, permissions, trust, policy, rollback, contract-integrity, and data-flow modules are critical and require 100% readiness. No overall score, waiver, popularity signal, or compatibility claim can compensate for a failed critical module.

External ecosystem work preserves the authority split among Forgevena Core, ForgeRegistry, ForgeHub, Source Adapters, Host Adapters, and Converters. AgentSpace remains a ForgeHub experience and Capability Studio remains the shared builder surface. A competing registry, runtime, policy engine, marketplace, or builder authority requires demonstrated necessity and architecture approval.

Compatibility and recommendation claims require dated evidence, expiry, limitations, and an owner. Trust, maturity, policy approval, compatibility, support, and popularity are assessed independently; no aggregate score may compensate for missing security, privacy, permission, or rollback evidence.

## 14. Roadmap Authority and Change Control

The [Versioned Product Roadmap](strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md) is the default execution authority for planned product work. Teams and agents must implement the currently approved version in dependency order and must not skip, reorder, replace, or silently expand release scope.

Execution details may improve when they preserve the approved outcome, architecture, compatibility, safety boundaries, acceptance criteria, and downstream dependencies. Such improvements must remain traceable in the change scorecard and roadmap reconciliation.

A roadmap-order or committed-scope change requires all of the following before implementation:

1. Demonstrated evidence that the approved sequence or scope creates a material security, reliability, compatibility, legal, operational, or user-value problem.
2. A discovery record and RFC describing alternatives, affected versions, dependency changes, cost, maintenance burden, and non-goals.
3. Architecture, security, privacy, accessibility, compatibility, migration, rollback, release, and documentation impact analysis.
4. An approved ADR and threat model when architecture or a trust boundary changes.
5. Updated readiness evidence, public roadmap, detailed roadmap, affected specifications, and release plans.
6. Explicit maintainer approval with a named owner, decision date, review date, and rollback path.

New ideas remain in the Innovation Opportunity Portfolio until promoted through the Evidence Funnel. They cannot enter the current release merely because they are valuable, easy, related, or already documented.

Emergency security or data-loss work may interrupt the sequence only through a patch or incident track approved by the responsible maintainer. The exception must be narrowly scoped, preserve evidence, document why normal ordering was unsafe, and reconcile the roadmap immediately after containment. Emergency work does not authorize unrelated redesign.

Every release closes with roadmap reconciliation classifying work as completed, deferred, rejected, discovered, deprecated, retired, or moved through an approved change. Implementation, tests, documentation, version metadata, tags, packages, and release evidence must agree before the next version begins.

## 15. Documentation Governance

The [Documentation Governance Standard](governance/DOCUMENTATION_GOVERNANCE_STANDARD.md) governs documentation authority, ownership, lifecycle, freshness, historical preservation, AI-agent readiness, and standards mapping. The [Documentation Authority Map](governance/DOCUMENTATION_AUTHORITY_MAP.md) identifies the human-readable sources of truth; the generated catalog is the machine-readable inventory.

The [Documentation Synchronization Policy](governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md) is the mandatory change-coupling procedure. Every pull request runs deterministic documentation impact analysis. Tier 2, Tier 3, release, migration, trust-boundary, and breaking changes retain both human-readable and machine-readable impact evidence with their readiness scorecard.

Significant documentation changes use the `documentation-content` readiness profile. Critical controls require 100%, important controls 95%, and standard controls 90%. Scores cannot compensate for a failed mandatory requirement, contradictory authority, stale evidence, unsupported certification claim, unsafe example, missing migration or rollback guidance, or an unindexed historical record.

External standards are tracked through the [Research and Standards Radar](strategy/RESEARCH_AND_STANDARDS_RADAR.md). A mapping is not certification. Certification language requires an approved scope, independent assessment, current evidence, accountable owner, expiry, and explicit maintainer approval.
