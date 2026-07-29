# v2.1.0 — ForgeRegistry Protocol Foundation

> **Purpose:** Feature specification for Deterministic Local Registry.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeRegistry Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v210--forgeregistry-protocol-foundation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `deterministic-local-registry`
- **Classification:** committed
- **Owner:** ForgeRegistry Maintainers

## Purpose and Problem

Resolve, lock, cache, verify, import, export, and roll back capability packages fully offline.

## Business and Developer Value

Users gain reproducible package management without depending on a hosted service.

## Architecture

A content-addressed store and deterministic solver persist immutable releases and managed installation ownership.

## Dependencies

- canonical-capability-package

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Resolution is deterministic.
- Corruption and dependency confusion are rejected.
- Rollback restores last-known-good managed state.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Resolver complexity.
- Cache growth and garbage collection safety.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
