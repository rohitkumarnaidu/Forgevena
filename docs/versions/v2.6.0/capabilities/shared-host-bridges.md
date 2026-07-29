# v2.6.0 — ForgeHub Intelligence and Experience

> **Purpose:** Feature specification for Shared Host and IDE Bridges.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Intelligence Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v260--forgehub-intelligence-and-experience`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `shared-host-bridges`
- **Classification:** committed
- **Owner:** ForgeHub Intelligence Maintainers

## Purpose and Problem

Expose governed capabilities through VS Code, JetBrains, Cursor, Codex, compatible CLIs, desktop agents, and cloud agents.

## Business and Developer Value

Users receive consistent safety and lifecycle behavior in their preferred tools.

## Architecture

Host adapters translate canonical capabilities and call shared Core and ForgeRegistry APIs with mandatory loss reports.

## Dependencies

- explainable-ecosystem-intelligence
- v1.5 host adapters

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- No bridge duplicates domain logic.
- Unsupported semantics fail visibly.
- Accessibility and security tests pass.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Host API churn.
- Degraded translations confuse users.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
