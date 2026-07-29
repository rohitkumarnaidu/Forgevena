# v1.8.0 — Observability, Supply Chain, and Documentation

> **Purpose:** Feature specification for Safe Local Observability.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Operations, Security, and Documentation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#11-v180--observability-supply-chain-and-documentation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `safe-local-observability`
- **Classification:** committed
- **Owner:** Operations, Security, and Documentation Maintainers

## Purpose and Problem

Provide structured logs, metrics, traces, diagnostics, crash reports, health summaries, and performance profiles.

## Business and Developer Value

Operators can diagnose failures without disclosing sensitive content.

## Architecture

All signals pass recursive redaction, classification, retention, and operation-correlation controls.

## Dependencies

- v1.7 policy decisions
- v1.3 state and redaction

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Secret/content exclusion tests pass.
- Retention and deletion are configurable.
- Diagnostic bundles are integrity-verified.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Metadata can still reveal sensitive patterns.
- High-cardinality signals consume resources.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
