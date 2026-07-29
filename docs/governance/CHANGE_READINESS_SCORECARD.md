# Enterprise Change Readiness and Push-Gate Scorecard

> **Authority:** Canonical readiness gate for every significant change to Forgevena.
>
> **Applies to:** Features, fixes, refactors, documentation, architecture, APIs, user interfaces, providers, plugins, registries, marketplaces, infrastructure, releases, ForgeHub, ForgeRegistry, and future AI Engineering Operating System capabilities.
>
> **Machine contract:** [`change-readiness-scorecard.schema.json`](../reference/schemas/change-readiness-scorecard.schema.json)

## 1. Purpose

This scorecard converts engineering judgment into retained evidence. A high score never overrides a mandatory blocker, constitutional invariant, security boundary, required review, or external approval. Human owners retain merge, release, deployment, and publication authority.

Use the same scorecard at three checkpoints:

1. **Push Ready:** Local validation permits a feature branch push. Hosted CI is not yet claimable.
2. **Merge Ready:** Hosted CI, required review, governance, and compatibility evidence permit merge.
3. **Release Ready:** Distribution, migration, rollback, documentation, package, and post-publication plans permit release.

The release checkpoint is prospective. Releases created before the current policy effective version are assessed through the [historical release governance retrospective](../reports/HISTORICAL_RELEASE_GOVERNANCE_RETROSPECTIVE.md), not reconstructed as if this scorecard existed at the time.

Significant changes retain both `scorecard.md` and `scorecard.json` under `docs/evidence/changes/<change-id>/`. Trivial typo-only corrections may record the rationale in the pull request instead.

## 2. Change Metadata

| Field | Required value |
| --- | --- |
| Change ID | Stable issue, RFC, or release identifier |
| Title | User-visible outcome |
| Owner | Named accountable maintainer or working group |
| Change type | Feature, fix, refactor, documentation, architecture, registry, marketplace, release, or other declared type |
| Applicability profile | One profile from Section 5 |
| Risk tier | `tier-0`, `tier-1`, `tier-2`, or `tier-3` |
| Checkpoint | `push`, `merge`, or `release` |
| Version | Target release or `unreleased` |
| Maturity | `experimental`, `preview`, `stable`, `enterprise-certified`, or `deprecated` |
| Scope | Affected commands, contracts, services, packages, files, users, and environments |
| Module assessments | One assessment per affected component with criticality, required score, result, rationale, and evidence |
| Requirements | Approved requirements and acceptance criteria |
| Non-goals | Explicitly excluded behavior |
| Evidence | Issues, RFCs, ADRs, threat models, tests, reports, builds, and review links |

## 3. Risk and Checkpoint Gates

| Risk tier | Typical changes | Push | Merge | Release |
| --- | --- | ---: | ---: | ---: |
| `tier-0` | Documentation or metadata-only | 80 | 85 | Not applicable |
| `tier-1` | Standard fix, feature, or refactor | 85 | 90 | 90 |
| `tier-2` | API, provider, plugin, registry, state, data, or deployment | 90 | 95 | 95 |
| `tier-3` | Security, vault, policy, breaking architecture, major version, ForgeRegistry, or control plane | 90 | 95 | 95 plus complete release evidence |

The overall threshold is only the first gate. Each active domain must also meet its profile-specific target, and each affected module must meet its criticality target. The risk-tier minimum of 70% or 80% remains a floor when it is higher than a profile rule. A `tier-0` change cannot use the release checkpoint.

### 3.1 Module Criticality Gates

| Module criticality | Push | Merge | Release | Typical scope |
| --- | ---: | ---: | ---: | --- |
| `standard` | 85 | 90 | 90 | Isolated, reversible, non-sensitive capability or documentation module |
| `important` | 90 | 95 | 95 | Shared runtime, user workflow, provider adapter, API, UI system, or package generator |
| `critical` | 95 | 100 | 100 | State, vault, policy, consent, rollback, security boundary, registry resolver, release authority, or control plane |

Every module score is calculated from explicit weighted acceptance criteria totaling 100 points. Mandatory criteria must pass; percentages cannot compensate for a mandatory failure. Module scores are not averaged together. One failed module blocks readiness even if every other module and the overall score are 100%.

### 3.2 Profile-Specific Domain Gates

The following are merge and release targets. Push targets are five points lower, but never below the selected risk-tier floor.

| Profile | Domains requiring 100% | Domains requiring 95% | Domains requiring 90% |
| --- | --- | --- | --- |
| Documentation | Product/policy, security/privacy/trust, compatibility/migration/release integrity | Architecture, API/contracts, accessibility, operations/support | Testing and documentation/developer experience |
| Standard code | Security | Testing, reliability, API/data, frontend, backend, DevOps, documentation, compatibility | Product, architecture, code quality, performance, operations |
| Frontend/UI | Security, frontend accessibility | Code, testing, reliability, performance, API/data, DevOps, documentation, compatibility | Product, architecture, backend, operations |
| Backend/API/data | Security, testing, reliability, API/data, backend, compatibility | Architecture, code, performance, DevOps, documentation, operations | Product, frontend |
| Platform/DevOps | Security, testing, reliability, backend, DevOps, compatibility, operations | Architecture, code, performance, API/data, documentation | Product, frontend |
| Security/trust | Architecture, security, testing, reliability, API/data, frontend, backend, DevOps, documentation, compatibility, operations | Product, code, performance | None |
| Registry/ecosystem | Architecture, security, testing, reliability, API/data, backend, DevOps, compatibility, operations | Product, code, performance, documentation | Frontend when applicable |
| Release/version | Product, security, testing, reliability, DevOps, documentation, compatibility, operations | Architecture, performance, API/data, frontend, backend | Code quality |

## 4. Score Calculation

The fourteen domain weights total 100 points. Each machine-readable domain divides its weight among explicit evidence items.

- `pass` earns 100% of the item points.
- `partial` earns 50%, but never satisfies a mandatory item.
- `fail` earns zero and prevents readiness when the item is mandatory or creates a blocker.
- `not-applicable` is removed from the denominator and requires a written rationale.
- Domain and overall percentages are normalized across applicable points and rounded down.
- Overall score is a summary metric; it cannot compensate for a failed domain or module gate.
- A domain is `pass` only when every applicable item passes; `partial` when no item fails but at least one is partial; `fail` when any item fails; and `not-applicable` only when every item is excluded.

Quality bands:

| Score | Quality level | Permitted use |
| --- | --- | --- |
| 95–100 | Enterprise ready | High-risk merge or release when all other gates pass |
| 90–94 | Production ready | Normal feature merge or release |
| 85–89 | Controlled low-risk | Low-risk changes only |
| Below 85 | Not ready | Hold or reject |

## 5. Applicability Profiles

Profiles establish expected domains; they never disable universal product, security, testing, documentation, compatibility, or governance obligations. Any excluded item requires a reason.

| Profile | Expected emphasis |
| --- | --- |
| `documentation-content` | Policy authority, architecture consistency, security of examples, documentation tests, API/contracts, compatibility, accessibility, operations, and support accuracy |

Documentation uses control-level criticality. Critical policy, security, privacy, trust, compatibility, migration, rollback, and contract-integrity controls require 100%. Important architecture, API, operations, accessibility, and release controls require 95%. Standard writing quality and developer-experience controls require 90%. Historical records are exempt from modernization but must be classified, indexed, and accurately separated from current authority.
| `standard-code` | Architecture, code quality, security, tests, reliability, performance, documentation, compatibility, and operations |
| `frontend-uiux` | Standard code plus UI states, responsive behavior, design-system compliance, accessibility, browser compatibility, and frontend performance |
| `backend-api-data` | Standard code plus API contracts, schemas, persistence, transactions, concurrency, integrations, and data migration |
| `platform-devops` | Runtime, CI/CD, deployment, supply chain, portability, rollback, observability, infrastructure cost, and operational recovery |
| `security-trust` | Threat model, identity, credentials, policy, cryptography, privacy, abuse cases, audit, recovery, and independent review |
| `registry-ecosystem` | Package protocol, metadata, trust, signatures, dependency resolution, compatibility, revocation, publishing, mirroring, and ecosystem safety |
| `release-version` | Version reconciliation, immutable tags, release evidence, packages, documentation, migration, rollback, channel verification, and post-release monitoring |
| `capability-package` | Package/capability separation, identity, contracts, permissions, data flows, signatures, provenance, lifecycle, and rollback |
| `host-adapter-portability` | Import/export fidelity, loss reports, permission preservation, host evidence, round trips, install/remove safety, and portability |
| `agent-team-runtime` | Role authority, topology, shared memory, delegation, concurrency, budgets, evaluation, human control, and recovery |
| `orchestration-automation` | Typed graphs, deterministic state, bounded loops, retries, compensation, replay, external effects, budgets, and cancellation |
| `rule-guardrail-package` | Deny-overrides policy, precedence, bypass resistance, scope, triggers, evidence, compatibility, and rollback |
| `knowledge-memory-capability` | Data classification, retention, isolation, deletion, indexing, retrieval evidence, privacy, and portability |
| `capability-builder-publisher` | Schema-driven UX, accessibility, permissions preview, tests, evaluation, signing, publishing, and publisher recovery |
| `marketplace-registry-distribution` | Resolution, namespaces, trust, moderation, accessibility, federation, offline distribution, revocation, and ecosystem operations |

### 5.1 Capability Risk Defaults

- Documentation-only capability work defaults to `tier-0`.
- Declarative, non-executable content packages default to `tier-1`.
- Tools, connectors, providers, executable plugins, memory, and host adapters default to `tier-2`.
- Security rules, agent teams, dynamic orchestration, secrets, external mutation, registry trust, and control-plane work default to `tier-3`.
- Tier-3 security, permissions, trust, policy, rollback, contract-integrity, and data-flow modules are `critical` and require 100% at merge and release. An overall score cannot compensate for any failed module.

## 6. Weighted Readiness Domains

Complete every applicable checklist item and link evidence in the retained scorecard.

### 6.1 Product Requirements and Governance — 6 Points

- Problem, users, measurable value, alternatives, and non-goals are documented.
- Scope, owner, Evidence Funnel stage, maturity, support level, and review date are assigned.
- Requirements trace to implementation and acceptance evidence.
- Open-source value, enterprise value, expected return, maintenance cost, and roadmap impact are assessed.
- Required RFC, ADR, threat model, policy, CODEOWNERS, and external approvals exist.

### 6.2 Architecture and System Design — 8 Points

- Existing architecture is reused and responsibilities are not duplicated.
- Components, interfaces, dependencies, data flows, trust boundaries, and failure boundaries are documented.
- Architecture preserves local-first operation, additive safety, explicit consent, and human authority.
- Scalability, portability, extensibility, isolation, lifecycle, and operational ownership are addressed.
- A new core abstraction has demonstrated need and an approved ADR.

### 6.3 Code Quality and Maintainability — 8 Points

- Implementation is correct, cohesive, readable, typed or validated, and consistent with repository conventions.
- SOLID, DRY, and KISS are applied without speculative abstraction.
- Errors are explicit; no swallowed exceptions, dead code, duplicate logic, placeholders, unexplained TODOs, or unsafe defaults remain.
- Dependencies are justified, maintained, licensed, pinned appropriately, and minimized.
- Complexity, ownership, testability, support burden, and technical debt are measured and accepted.

### 6.4 Security, Privacy, Identity, and Trust — 10 Points

- Threat model covers assets, actors, trust boundaries, abuse paths, and mitigations.
- Authentication, authorization, least privilege, policy, credential lifecycle, and audit are correct.
- Input, path, command, network, archive, serialization, and dependency boundaries fail closed.
- Secrets, prompts, responses, personal data, credential metadata, and authorization data are protected and redacted.
- Data collection, retention, egress, deletion, encryption, consent, and regulatory impact are documented.
- Security scans, dependency review, provenance, signatures, and incident procedures pass.

### 6.5 Testing and Quality Assurance — 12 Points

- Unit, integration, contract, CLI, end-to-end, regression, and negative tests cover changed behavior.
- Edge cases, invalid inputs, unavailable dependencies, permissions, timeouts, retries, cancellation, and partial failure are tested.
- Required coverage, mutation, fuzz, concurrency, crash, golden, browser, accessibility, and account-gated tests pass where applicable.
- Tests are deterministic, isolated, cross-platform, secret-safe, and free of unexplained skips or flaky retries.
- Acceptance criteria and previously reported defects have explicit regression evidence.

### 6.6 Reliability, Resilience, Recovery, and Rollback — 8 Points

- Failure modes, degraded behavior, retry safety, idempotency, timeouts, and resource cleanup are defined.
- State changes are atomic, validated, journaled, recoverable, and protected from corruption where applicable.
- Backups, rollback ownership, rollback limits, disaster recovery, and last-known-good behavior are tested.
- Offline, dependency-outage, provider-failure, process-crash, disk, permission, and interruption behavior is appropriate.
- No unmanaged local or remote resource is silently modified or deleted.

### 6.7 Performance, Scalability, Cost, and Resource Use — 6 Points

- Latency, throughput, startup, memory, storage, network, concurrency, and scale expectations are defined.
- Benchmarks compare approved baselines and explain regressions.
- Caching, batching, pagination, backpressure, rate limits, and workload bounds are safe.
- Provider, CI, cloud, support, and local-compute costs are forecast where applicable.
- Resource and energy use are proportionate to user value.

### 6.8 API, Contracts, Schemas, and Data Integrity — 6 Points

- Public commands, APIs, schemas, protocols, events, errors, and structured outputs are versioned and documented.
- Validation, defaults, nullability, pagination, idempotency, compatibility, and error semantics are deterministic.
- Data ownership, transactions, constraints, indexes, migrations, retention, deletion, and consistency are correct.
- Contract tests cover consumers, providers, malformed data, older versions, and unsupported capabilities.
- Breaking changes include deprecation, migration, rollback, and major-version approval.

### 6.9 Frontend, UI/UX, Responsiveness, and Accessibility — 6 Points

- User journeys, information architecture, empty/loading/error/success states, and recovery paths are complete.
- Design tokens, components, visual hierarchy, responsive layouts, dark mode, motion, and content are consistent.
- Keyboard use, focus, semantics, labels, contrast, screen readers, reduced motion, zoom, and localization are verified.
- Browser/device compatibility, frontend security, performance budgets, and analytics consent are addressed.
- User-facing consent, risk, cost, data destination, and irreversible effects are understandable before action.

### 6.10 Backend, Persistence, Integrations, and Concurrency — 6 Points

- Domain boundaries, service contracts, persistence, transactions, concurrency, queues, schedules, and consistency are correct.
- Integrations define authentication, rate limits, retries, idempotency, timeouts, data use, compatibility, and degradation.
- Database, cache, file, network, and external-service failures remain observable and recoverable.
- Background work is bounded, cancellable, deduplicated, and safely replayable where applicable.
- Data and credential values never cross unauthorized boundaries.

### 6.11 DevOps, CI/CD, Deployment, and Supply Chain — 8 Points

- CI runs required operating systems, runtimes, tests, documentation, security, packaging, and compatibility gates.
- Builds are reproducible; lockfiles, checksums, SBOMs, provenance, signatures, licenses, and attestations are valid.
- Deployment is preview-first, environment-aware, secret-safe, least-privileged, observable, and rollback-capable.
- Containers, packages, installers, update channels, infrastructure, and generated assets validate and smoke-test.
- Publication, billing, cloud creation, and external submissions require owner credentials and explicit approval.

### 6.12 Documentation and Developer Experience — 6 Points

- README, CLI help, API/schema references, architecture, examples, tutorials, troubleshooting, operations, security, and migration guidance are current.
- Documentation examples execute, links resolve, generated references have no drift, and the strict site build passes.
- Installation, configuration, upgrade, rollback, uninstall, limitations, support, and incident paths are clear.
- Human and machine interfaces provide actionable errors, stable exit codes, discoverability, and accessible workflows.
- Changelog, release notes, roadmap, feature matrix, and compatibility claims agree with implementation.

### 6.13 Compatibility, Migration, Versioning, and Release Safety — 6 Points

- Backward compatibility covers commands, schemas, state, files, packages, platforms, integrations, and aliases.
- Migration is previewable, validated, backed up, reversible where possible, and tested from supported versions.
- Deprecations include owner, warning period, replacement, support window, and retirement evidence.
- Version, tag, package, documentation, release assets, compatibility evidence, and distribution channels agree.
- Upgrade and rollback rehearsals preserve user ownership and fail visibly without silent reset.

### 6.14 Observability, Operations, Support, and Sustainability — 4 Points

- Logs, metrics, traces, health, diagnostics, correlation IDs, retention, and redaction are appropriate.
- Alerts, dashboards, runbooks, escalation, incident response, recovery objectives, and support ownership exist.
- Post-release monitoring, adoption, task success, compatibility freshness, maintainer load, and review dates are defined.
- Bus factor, succession, dependency lifecycle, support burden, long-term cost, and retirement are sustainable.

## 7. Mandatory Blockers

Every blocker must be recorded as `clear`, `triggered`, or `not-applicable`. A triggered blocker forces `hold` or `reject` regardless of score.

1. Required test, CI, build, lint, documentation, or package validation fails.
2. Critical/high security risk or detected secret exposure remains unresolved.
3. Existing user files are overwritten or unmanaged assets are deleted.
4. Required architecture, security, trust-boundary, policy, or CODEOWNERS approval is missing.
5. A breaking contract lacks approved migration, compatibility, deprecation, and rollback plans.
6. A managed mutation lacks tested recovery or rollback evidence.
7. A maturity, compatibility, certification, or support claim lacks current evidence.
8. A waiver is prohibited, invalid, unapproved, ownerless, or expired.
9. License, provenance, signature, SBOM, dependency, or supply-chain verification fails.
10. Release version, tag, documentation, package, artifact, or channel metadata disagrees.
11. A user-facing interface lacks required accessibility review.
12. External data transfer, deployment, billing, publication, or irreversible action lacks explicit approval.

## 8. Checkpoint Evidence

### Push Ready

- Local tests, lint, static checks, documentation validation, and affected builds pass.
- Preliminary score meets the risk-tier push threshold.
- No known mandatory blocker is triggered.
- The branch contains no secret, local state, cache, generated noise, or unrelated change.
- Hosted CI and reviewer approval remain explicitly pending.

### Merge Ready

- Hosted CI, required platform matrices, security, dependency, documentation, package, and compatibility checks pass.
- Required maintainers, CODEOWNERS, security owners, and architecture reviewers approve.
- Final score meets the merge threshold and every active domain meets its minimum.
- Waivers are valid, time-limited, linked, and approved.
- Migration, rollback, documentation, and operational evidence are complete.

### Release Ready

- Merge-ready evidence is attached to the exact immutable release commit.
- Release candidate installation, upgrade, rollback, uninstall, offline, and post-install health tests pass.
- Version, changelog, notes, docs, tag, package metadata, SBOM, provenance, checksums, signatures, and assets agree.
- Every supported distribution channel is verified or explicitly recorded as externally pending.
- Human promotion, publication, billing, and environment approvals are complete.
- Post-release verification, monitoring, support, and review owners are scheduled.

## 9. Conditional Future-System Gates

These sections apply only when the affected scope includes the named future product. They do not authorize implementation or assign a release.

### ForgeHub

- Discovery, search, ranking, installation, update, review, and publishing journeys are usable and accessible.
- Publisher identity, ownership, moderation, abuse reporting, review integrity, malware response, and appeal paths are governed.
- Ratings, recommendations, analytics, and search avoid manipulation, hidden sponsorship, and unconsented tracking.
- Public, private, organization, and offline catalog experiences preserve policy and user ownership.

### ForgeRegistry

- Package format, manifest, namespace, metadata, signatures, provenance, dependencies, versions, and compatibility protocols are specified and tested.
- Publisher trust, key rotation, revocation, vulnerability status, yanking, immutability, mirrors, and transparency records fail closed.
- Resolution is deterministic across official, private, organization, cached, and air-gapped registries.
- Protocol conformance, replication, conflict handling, availability, retention, disaster recovery, and migration are verified.

### Publisher Platform and Marketplace

- Publisher identity, namespace ownership, recovery, transfer, signing, provenance, support, deprecation, withdrawal, and vulnerability response are tested.
- Malicious, malformed, unsigned, incompatible, and over-privileged packages fail safely before publication.
- Search ranking, sponsorship, reviews, moderation, appeals, anti-abuse, accessibility, and incident response are transparent and auditable.
- Publication and installation remain deterministic, staged, reversible, and free of unsupported trust claims.

### Organization Ecosystem and Federation

- Deny-overrides policy applies across every registry, mirror, package, scope, and alternate command path.
- Tenant isolation, delegated administration, portable audit, approval history, offline promotion, and data residency are verified.
- Mirrors preserve origin, signature, revocation, and namespace authority; conflicts and outages recover deterministically.
- Public, private, managed, mirrored, and air-gapped operation remain interoperable and exportable.

### AI Engineering Operating System

- Local operation remains complete without account, telemetry, or control-plane availability.
- Policy, consent, state, audit, providers, plugins, workflows, IDE bridges, and user interfaces reuse shared domain contracts.
- Project content, prompts, responses, credentials, evidence, and indexes cross boundaries only through explicit scoped authorization.
- Human authority governs mutation, deployment, publication, policy, billing, and irreversible actions.
- Optional remote services are self-hostable, tenant-isolated, recoverable, and unable to silently weaken local guarantees.

## 10. Waivers and Approval

Waivers cannot excuse secret exposure, silent overwrite, unconsented external effects, policy bypass, falsified evidence, mutable release tags, or unresolved critical/high security findings. Every permitted waiver records owner, requirement, risk, compensating control, approver, creation, expiry, and remediation issue in `waivers.json`.

Final approval records:

| Field | Value |
| --- | --- |
| Calculated score | 0–100 |
| Quality band | Enterprise ready, production ready, controlled low-risk, or not ready |
| Threshold | Derived from risk tier and checkpoint |
| Mandatory blockers | Clear, triggered, or not applicable with rationale |
| Decision | `ready`, `hold`, or `reject` |
| Approvers | Named reviewers and roles |
| Assessed at | ISO 8601 timestamp |
| Reviewed at | ISO 8601 timestamp or pending |
| Decision rationale | Evidence-based explanation |

## 11. Final Rule

Code may be pushed, merged, or released only when the relevant checkpoint is `ready`, the overall threshold passes, every profile-specific domain target passes, every affected-module target passes, mandatory blockers are clear, required evidence exists, waivers are valid, and the responsible human authority approves. If evidence and score disagree, choose the safer decision and investigate the scoring model.

## 12. Schema v2 Migration

Schema v2 adds explicit module assessments, weighted module acceptance criteria, and derived domain/module gate results. Historical schema v1 scorecards remain immutable evidence, but they cannot authorize a new push, merge, or release. To migrate, classify every affected component as `standard`, `important`, or `critical`, define criteria totaling 100 points, attach evidence, calculate its checkpoint target, and regenerate totals using the current validator.
