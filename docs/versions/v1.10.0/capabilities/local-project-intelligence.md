# v1.10.0 — Engineering Intelligence and Local Enterprise GA

> **Purpose:** Feature specification for Local Project Intelligence.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Engineering Intelligence Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#13-v1100--engineering-intelligence-and-local-enterprise-ga`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `local-project-intelligence`
- **Classification:** committed
- **Owner:** Engineering Intelligence Maintainers

## Purpose and Problem

Index symbols, manifests, documentation, dependencies, and relationships with optional governed semantic metadata.

## Business and Developer Value

Users gain fast local architecture and dependency insight without mandatory data egress.

## Architecture

Incremental indexes retain approved metadata, integrity hashes, ignore policy, ownership, and deletion state.

## Dependencies

- v1.9 workflows
- v1.8 observability and evidence

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Raw source is excluded by default.
- Incremental updates and deletion pass.
- Corrupt indexes fail visibly and rebuild safely.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Metadata privacy leakage.
- Stale relationships can mislead users.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
