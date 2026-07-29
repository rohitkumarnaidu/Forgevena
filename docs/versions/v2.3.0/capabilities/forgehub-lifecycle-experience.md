# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Feature specification for ForgeHub Lifecycle Experience.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `forgehub-lifecycle-experience`
- **Classification:** committed
- **Owner:** ForgeHub Product Maintainers

## Purpose and Problem

Provide search, package details, docs, compatibility, versions, installation plans, updates, rollback, health, and history.

## Business and Developer Value

Users manage the ecosystem through one accessible, explainable experience.

## Architecture

CLI and dashboard call shared Core lifecycle services and resolve packages exclusively through ForgeRegistry.

## Dependencies

- v2.2 federated registries

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- All scopes and precedence rules pass.
- Uninstall and rollback evidence is complete.
- No interface bypasses policy or consent.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Scope confusion.
- Search ranking manipulation.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
