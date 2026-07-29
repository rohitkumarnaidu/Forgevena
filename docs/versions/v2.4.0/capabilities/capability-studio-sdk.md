# v2.4.0 — Publisher Platform and Ecosystem SDK

> **Purpose:** Feature specification for Capability Studio and SDK.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Publisher Platform Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v240--publisher-platform-and-ecosystem-sdk`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `capability-studio-sdk`
- **Classification:** committed
- **Owner:** Publisher Platform Maintainers

## Purpose and Problem

Provide one schema-driven builder with profiles for agents, workflows, knowledge, tools, interfaces, templates, packages, and evaluations.

## Business and Developer Value

Publishers receive consistent security, testing, documentation, compatibility, and signing workflows.

## Architecture

Profiles share canonical schemas, validators, sandbox tests, permission previews, and SDK fixtures.

## Dependencies

- v2.3 lifecycle UX
- v2.1 package contracts

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Every profile emits valid packages.
- SDK fixtures are deterministic.
- Builders cannot bypass trust or permission gates.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Builder abstraction may hide type-specific needs.
- SDK compatibility burden.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
