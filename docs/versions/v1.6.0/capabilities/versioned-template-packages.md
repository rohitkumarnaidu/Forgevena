# v1.6.0 — Template Packages and Native Distribution

> **Purpose:** Feature specification for Versioned Template Packages.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Template and Distribution Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#9-v160--template-packages-and-native-distribution`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `versioned-template-packages`
- **Classification:** committed
- **Owner:** Template and Distribution Maintainers

## Purpose and Problem

Package templates with schemas, assets, hashes, lockfiles, tests, compatibility, inheritance, and signatures.

## Business and Developer Value

Templates evolve independently without changing core code.

## Architecture

A package loader verifies immutable content before the existing additive bootstrap engine renders managed assets.

## Dependencies

- v1.5 package trust and isolation foundations

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- All built-in templates are packaged.
- Tampered packages fail closed.
- Existing files remain unchanged.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Template drift.
- Dependency lockfiles become stale.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
