# v1.7.0 — Local Organization Governance

> **Purpose:** Feature specification for Signed Organization Policy Bundles.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Governance and Policy Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#10-v170--local-organization-governance`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `signed-organization-policy`
- **Classification:** committed
- **Owner:** Governance and Policy Maintainers

## Purpose and Problem

Define organizations, principals, roles, permissions, approved artifacts, and capability rules in signed local bundles.

## Business and Developer Value

Teams gain enforceable governance without deploying a server.

## Architecture

Policy bundles are schema-validated, signed, imported transactionally, and evaluated by one deny-overrides engine.

## Dependencies

- v1.6 signed packages and catalogs

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Signatures and schema fail closed.
- Import/export is portable.
- Denied operations cannot use alternate commands.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Policy lockout.
- Complex precedence may surprise users.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
