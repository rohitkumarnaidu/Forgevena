# Implementation Specification Standard

## Purpose

This standard defines the minimum normative content required before a Forgevena version may receive an implementation-readiness verdict of `APPROVE`. It applies to engineering teams and AI coding agents equally and supplements the Platform Constitution, Engineering Governance, and Change Readiness Scorecard.

## Authority and Interpretation

- Version packages define deltas; canonical foundation documents define permanent platform invariants.
- `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative terms.
- A version-specific rule overrides this standard only when an approved decision record explicitly identifies the override and remains within the Platform Constitution.
- Undefined behavior fails closed. Implementers must not infer permissions, data use, compatibility, external effects, or destructive behavior.
- Documentation approval specifies required implementation and evidence; it never claims that future tests, reviews, certifications, or external services have completed.

## Common Runtime Contract

Every capability has the lifecycle `unavailable -> discovered -> configured -> validated -> ready -> active -> degraded|failed -> disabled|removed`. Mutating transitions require preview, policy evaluation, `--apply`, and explicit consent at external-effect boundaries. Every transition emits a stable operation ID, structured status, warnings, planned or completed changes, and a stable error code.

Ownership is singular for persisted state. Cross-module communication uses documented domain services rather than direct state-file access. State mutations use the StateEngine transaction, locking, checksum, journal, recovery, snapshot, and rollback contracts. Secrets are referenced through the vault and never copied into configuration, logs, diagnostics, evidence, fixtures, or child-process environments unless a narrowly scoped operation explicitly requires it.

## Public Interface Baseline

- Human output is concise and actionable; structured output uses the existing versioned envelope.
- Preview is the default for mutations. `--dry-run` performs no managed write. `--apply` authorizes local managed changes; network, publication, billing, credential use, or deployment additionally requires explicit consent.
- Exit codes distinguish success, invalid input, policy denial, consent required, authentication failure, unavailable dependency, compatibility failure, conflict, partial recovery, and internal failure.
- Schemas reject unknown security-sensitive fields and preserve unknown forward-compatible metadata only where the owning contract explicitly permits it.
- Pagination, streaming, cancellation, timeouts, ordering, retries, and idempotency are explicitly defined by each surface that supports them.
- Existing 1.x commands, aliases, `.ai-workspace` paths, additive-only behavior, and structured output remain compatible unless a major-version migration states otherwise.

## Security, Privacy, and Human Authority

Every version records actors, assets, trust boundaries, permissions, data classes, data flows, retention, deletion, residency, redaction, abuse cases, emergency controls, and residual risks. Deny overrides allow. Lower scopes may restrict authority but cannot broaden it. Raw credentials are never exposed to plugins, templates, workflows, recommendations, diagnostics, or registries.

Human approval remains mandatory for mutation, deployment, publication, billing, privilege expansion, trust-root changes, destructive recovery, and release promotion. Kill switches must disable new external effects while preserving inspection, export, diagnostics, and recovery.

## Reliability and Recovery

Operations classify external effects as read-only, idempotent, conditionally idempotent, or non-idempotent. Retries are bounded, use jitter, honor service backoff, preserve deadlines, and never retry unsafe effects automatically. Long-running operations support cancellation and checkpoints. Partial failure records completed effects and provides compensation, rollback, or explicit manual recovery.

Each version defines latency, throughput, capacity, durability, availability, recovery-time, recovery-point, cost, and resource targets for a documented reference workload. Targets are release gates, not unsupported production guarantees.

## Migration and Compatibility

Every migration has detection, preflight, preview, backup, transformation, validation, commit, recovery, rollback, and roll-forward states. Existing data is never silently reset. Irreversible transformations require an exportable backup and explicit warning. Compatibility evidence records scope, fixture versions, verification date, expiry, and limitations.

## Verification Matrix

Every normative requirement maps to deterministic unit, contract, integration, CLI end-to-end, negative, adversarial, accessibility, migration, rollback, recovery, and documentation evidence as applicable. High-risk capabilities additionally require fuzz, concurrency, crash-injection, privilege-denial, and performance tests. Account-backed or external-service tests remain opt-in and credential-gated.

Required evidence identifies its future producer, schema, retention, freshness, pass threshold, and failure triage owner. Planned evidence must be labelled `required`; only executed and retained evidence may be labelled `verified`.

## Documentation Pattern

Every version package must contain:

- A README that identifies purpose, owners, status, dependencies, scope, and navigation.
- Normative feature specifications with requirements, lifecycle, failure modes, examples, and acceptance criteria.
- An executable architecture delta with components, ownership, state, data/control flows, concurrency, and prohibited coupling.
- Exact interface contracts and schema examples.
- A threat model and data-flow specification.
- A test and evaluation matrix.
- A migration, rollback, roll-forward, and release plan.
- Service objectives and operational runbooks.
- Decision records resolving every implementation-affecting question.
- Evidence requirements without fabricated results.

## Approval Gate

A version may receive `APPROVE` only when all open questions are resolved normatively, every committed feature is fully traced, all references resolve, critical modules score 100%, important modules score at least 95%, standard modules score at least 90%, the overall score is at least 95%, and no owned or inherited blocker remains.
