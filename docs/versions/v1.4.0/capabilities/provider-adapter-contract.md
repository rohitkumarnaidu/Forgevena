# v1.4.0 — Production Provider Platform

> **Purpose:** Feature specification for Provider Adapter Contract.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Provider Platform Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#7-v140--production-provider-platform`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `provider-adapter-contract`
- **Classification:** committed
- **Owner:** Provider Platform Maintainers

## Purpose and Problem

Standardize metadata, authentication references, discovery, invocation, streaming, structured output, tools, health, usage, and errors.

## Business and Developer Value

One governed provider contract reduces duplicated logic and inconsistent safety behavior.

## Architecture

Adapters execute behind application context, policy, consent, vault references, redaction, and audit services.

## Dependencies

- v1.3 state, vault, error, and application-context contracts

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- All adapters pass one contract suite.
- Unknown capabilities fail visibly.
- Credentials never enter adapter output.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Provider API drift.
- Capability normalization may hide semantic differences.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
