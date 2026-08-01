# v1.9.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Portable workflow state:** portable state contains workflow and node versions, typed input/output hashes, completion status, attempt counters, approved metadata, checkpoints, consent receipts, external-effect receipts, and error classifications. Host process IDs, raw provider payloads, credentials, absolute private paths, and nonportable handles are excluded.
- **Nondeterminism:** every provider-backed node records provider profile, model identifier, compatibility evidence, parameters, seed when supported, fixture or response hash, usage, and nondeterminism classification. Replay may verify recorded output or re-execute explicitly; it never claims bitwise determinism for live model calls.

## Asset and Workflow Contracts

Prompt and skill releases declare identity, version, provenance, variables, input/output schema, compatibility, license, policy status, signatures, evaluation suite, support, and deprecation. Workflow definitions declare nodes, edges, typed state, conditions, external-effect class, retries, timeout, cancellation, compensation, checkpoint, consent, budgets, and required capabilities.

The engine validates acyclic DAGs unless a node is an explicit bounded-loop construct. Loops require maximum iterations, duration, token and cost budget, termination predicate, cancellation, and failure policy. Execution states are `planned`, `validated`, `awaiting-consent`, `running`, `checkpointed`, `suspended`, `resuming`, `compensating`, `completed`, `cancelled`, and `failed`.

## Idempotency, Resume, and Human Authority

Completed nodes are not repeated on resume unless marked replayable and explicitly requested. External effects require idempotency keys or a recorded non-repeatable receipt. A crash after an uncertain effect enters `manual-reconciliation` rather than retrying. Mutating nodes require preview, policy approval, managed ownership, and consent. Release, deployment, publication, billing, and destructive operations always retain human promotion authority.

## Interfaces and Catalogs

Commands support inspect, validate, explain, dry-run, run, cancel, resume, replay, history, export, and verify. Visualization uses the same graph and state contract. Official catalogs are signed and never auto-install. Invalid signatures, incompatible platform ranges, expired evidence, or unapproved policies fail closed.

## Verification and Operations

Tests cover deterministic ordering, invalid graphs, cycle detection, loop bounds, retry exhaustion, cancellation, crash checkpoints, uncertain effects, compensation, policy denial, consent expiry, schema mismatch, signature failure, model drift, and replay. Engine overhead targets p95 below 50 ms per local node excluding capability execution. `v1.9.0` is done when interruption/resume never duplicates completed external effects, signed assets fail closed, and retained traces explain every state transition.

## Scope, Ownership, Inputs, and Outputs

Workflow and Engineering Assets Maintainers own `signed-engineering-assets` and `deterministic-workflow-engine`. Inputs are signed prompt or skill releases, typed workflow definitions, approved variables, policy decisions, consent checkpoints, budgets, and resumable state. Outputs are immutable execution plans, node results, state transitions, compensation records, evaluation summaries, and metadata-only audit evidence. Workflow state is `draft`, `validated`, `planned`, `waiting-consent`, `running`, `paused`, `compensating`, `succeeded`, `failed`, or `cancelled`; every event identifies the workflow, release, node, attempt, and operation.

## Security, Permissions, and Data Flow

Each node declares permission, data class, external-effect class, provider use, secret reference, and output retention. Data flow between nodes is schema-checked; undeclared fields and privilege expansion are rejected. Prompt bodies, model responses, and secret values are excluded from audit evidence unless an explicit content-retention policy exists. Human approval is mandatory before mutation, deployment, publication, billing, credential use, or resuming an uncertain external effect. Shared memory is scoped to the run and cannot cross organization or project boundaries without policy authorization.

## Failure, Recovery, Migration, and Rollback

Failure policy distinguishes retryable local work, idempotent external work, non-idempotent effects, and uncertain outcomes. Recovery resumes from the last durable checkpoint and never repeats a completed external effect without a verified idempotency key. Migration pins the source workflow schema and writes a reversible state transform. Rollback executes declared compensations in reverse dependency order; roll-forward can replace only not-yet-started nodes with a compatible release. Cancellation is bounded, compensation failures remain visible, and a kill switch stops new scheduling while preserving inspection and export.

## Service Objectives and Capacity

Scheduler overhead has a service level objective of p95 below 50 ms per local node and checkpoint writes below 100 ms. A workflow supports 1,000 nodes, 32 concurrent ready nodes, 10 bounded loop iterations by default, and a configurable maximum duration of 24 hours. Every run declares token and cost budget limits before provider execution. Engine health reports queue depth, blocked approvals, stale checkpoints, compensation failures, and budget exhaustion without exposing content.

## Verification and Acceptance Evidence

The test matrix includes unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Required fixtures cover cycles, deadlock, livelock, cancellation races, crash recovery, uncertain effects, expired consent, schema mismatch, signature failure, prompt injection, provider outage, and compensation failure. Acceptance evidence includes deterministic trace comparisons, checkpoint integrity, bounded-loop proof, permission decisions, replay results, and no-duplicate-effect assertions. The evidence owner is Workflow and Engineering Assets Maintainers; signed catalog and release evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must follow the declared graph, types, budgets, consent points, and effect classification. It must not infer missing edges, permissions, retry safety, compensation, or approval. An incomplete node contract, unknown effect state, invalid signature, or exceeded budget must fail closed. The agent may recommend a repair plan but requires human approval before changing workflow semantics or executing any external effect.
