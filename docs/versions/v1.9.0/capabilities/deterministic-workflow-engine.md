# v1.9.0 — Signed Skills and Deterministic Workflows

> **Purpose:** Feature specification for Deterministic Workflow Engine.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Workflow and Engineering Assets Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#12-v190--signed-skills-and-deterministic-workflows`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `deterministic-workflow-engine`
- **Classification:** committed
- **Owner:** Workflow and Engineering Assets Maintainers

## Purpose and Problem

Execute explicit chains, DAGs, state machines, bounded loops, and human checkpoints with resumable state.

## Business and Developer Value

Teams automate repeatable engineering work without surrendering human promotion authority.

## Architecture

Versioned nodes classify effects, persist checkpoints transactionally, and call governed provider or plugin interfaces.

## Dependencies

- signed-engineering-assets

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Resume does not duplicate effects.
- Cycles and excessive retries are rejected.
- Cancellation and compensation are auditable.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Deadlock or livelock.
- Cost or token runaway.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
