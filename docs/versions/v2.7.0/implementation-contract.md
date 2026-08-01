# v2.7.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Certification governance:** criteria are versioned, public, evidence-based, and governed by a multi-stakeholder committee with conflict disclosures, term limits, recorded decisions, and an appeal panel independent of the original reviewer. Certification expires and may be revoked; it is never a blanket security guarantee.
- **Private evidence:** organizations disclose signed summaries, control results, hashes, assessor identity, scope, dates, and limitations. Raw private evidence is released only to authorized auditors under explicit policy and retention. Selective disclosure never changes the underlying result.

## Compatibility and Evaluation Network

Compatibility Laboratory records platform, host, provider, framework, package, fixture, environment, test version, result, date, expiry, and limitations. AI Evaluation Center records task, dataset provenance, model/profile, parameters, safety controls, latency, cost, reliability, quality metrics, and nondeterminism. Recorded fixtures are sanitized and reproducible.

Transparency records are append-only signed events for publication, ownership, signature, provenance, compatibility, vulnerability, moderation, certification, revocation, and appeal. Corrections append; history is not rewritten. Advisories identify affected ranges, severity basis, exploit context, remediation, safe versions, and disclosure timeline.

## Expiry, Revocation, and Appeals

Evidence TTL depends on maturity and change rate, with 90 days as the hosted-provider default and 180 days for pinned stable local artifacts. Expired evidence becomes stale and cannot support enterprise-certified claims. Emergency revocation propagates independently of normal catalog refresh and preserves last-known-good policy-controlled operation when safe.

Appeals have eligibility, submission evidence, response SLA, independent review, interim status, final rationale, and re-review rules. Certification displays scope and limitations prominently.

## Verification

Tests cover log equivocation, stale evidence, forged assessor records, private-data leakage, advisory conflicts, revocation latency, offline revocation bundles, appeal independence, fixture reproducibility, and misleading score prevention. `v2.7.0` is done when evidence is dated and reproducible, expiry and revocation work across federation, and certification limitations are transparent.

## Scope, Ownership, Inputs, and Outputs

Trust and Compatibility Maintainers own `compatibility-evaluation-labs` and `transparency-advisory-revocation`. Inputs are signed test fixtures, assessor identity, package and host versions, provider model versions, evaluation protocols, advisories, revocations, appeals, and transparency checkpoints. Outputs are dated compatibility matrices, reproducible evaluation records, signed advisories, revocation bundles, certification scope statements, limitation disclosures, and appeal decisions. Evidence state is `draft`, `verified`, `current`, `stale`, `expired`, `disputed`, or `revoked`.

## Security, Permissions, and Data Flow

Assessor permission, publisher identity, and evidence-signing authority are distinct. Data flow uses synthetic or explicitly approved fixtures and excludes credentials, private source, prompts, responses, tenant metadata, and unpublished vulnerabilities from public records. Retention is permanent for public checkpoints, revocations, and final appeal rationale; sensitive disclosure evidence follows coordinated-disclosure policy. Human approval is required for certification, advisory publication, revocation, exception, appeal disposition, and trust-root changes.

## Failure, Recovery, Migration, and Rollback

Failed or irreproducible evaluation cannot support a compatibility or certification claim. Recovery replays signed fixtures against pinned dependencies and identifies divergence. Migration preserves prior evidence schemas and verification tools. Rollback retracts a claim through a signed superseding record without erasing history; roll-forward publishes corrected evidence. Emergency revocation has an independent kill switch and offline propagation path, while disputed evidence is visibly marked rather than silently removed.

## Service Objectives and Capacity

Every laboratory and transparency deployment declares compute, storage, transfer, and assessor-review cost budgets.

Online revocation propagation has a service level objective below 60 seconds, transparency checkpoint publication below 5 minutes, and standard fixture replay below 30 minutes. The system supports 1,000,000 evidence records and 100 concurrent evaluation workers with bounded queues. Hosted-provider compatibility evidence expires after 90 days and pinned stable local evidence after 180 days by default. Health reports checkpoint consistency, evidence age, replay success, advisory conflicts, revocation lag, and appeal backlog.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover equivocation, forged assessors, stale evidence, private-data leakage, conflicting advisories, revocation delay, offline bundles, appeal independence, non-reproducible results, and deceptive composite scoring. Acceptance evidence includes reproducible fixture results, independent checkpoint verification, expiry exercises, revocation timing, privacy review, appeal audit, and limitation display checks. The evidence owner is Trust and Compatibility Maintainers; transparency, advisory, revocation, certification, and appeal evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer certification, safety, compatibility, assessor trust, advisory resolution, or appeal outcome. Expired, disputed, missing, unverifiable, or revoked evidence must fail closed for support claims. The agent may prepare analysis and draft evidence, but certification, publication, revocation, trust changes, and appeals require human approval.
