# v1.7.0 — Local Organization Governance

> **Purpose:** Feature specification for Policy Simulation and Compliance.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Governance and Policy Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#10-v170--local-organization-governance`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `policy-simulation-compliance`
- **Classification:** committed
- **Owner:** Governance and Policy Maintainers

## Purpose and Problem

Explain effective policy, detect bypass paths, and export metadata-only audit and compliance evidence.

## Business and Developer Value

Reviewers can predict policy impact before enforcing changes.

## Architecture

The simulator evaluates proposed bundles against recorded operation shapes without executing effects.

## Dependencies

- signed-organization-policy

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Simulation matches runtime decisions.
- Bypass analysis covers every command family.
- Exports contain no secrets or source content.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Simulation/runtime drift.
- Misleading compliance claims.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
