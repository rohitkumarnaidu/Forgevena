# v2.0.0 — Optional Self-Hosted Organization Control Plane

> **Purpose:** Feature specification for Self-Hosted Organization Control Plane.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Control Plane Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#14-v200--optional-self-hosted-organization-control-plane`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `self-hosted-control-plane`
- **Classification:** committed
- **Owner:** Control Plane Maintainers

## Purpose and Problem

Distribute signed policy and catalogs, retain audit evidence, and manage fleet inventory through an optional service.

## Business and Developer Value

Enterprises coordinate many workspaces without sacrificing local autonomy.

## Architecture

A tenant-isolated service exchanges encrypted, policy-approved metadata through versioned synchronization contracts.

## Dependencies

- v1.10 local enterprise GA

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Self-hosted deployment is documented and tested.
- Local clients work during outages.
- Tenant isolation passes independent review.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Cross-tenant data exposure.
- Operational complexity and disaster recovery.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
