# v1.9.0 — Signed Skills and Deterministic Workflows

> **Purpose:** Feature specification for Signed Skills, Prompts, and Rules.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Workflow and Engineering Assets Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#12-v190--signed-skills-and-deterministic-workflows`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `signed-engineering-assets`
- **Classification:** committed
- **Owner:** Workflow and Engineering Assets Maintainers

## Purpose and Problem

Register versioned skills, prompts, packs, and rules with provenance, variables, compatibility, licensing, policy, and signatures.

## Business and Developer Value

Engineering behavior becomes discoverable, reviewable, portable, and governable.

## Architecture

Assets are immutable definitions resolved through signed catalogs and evaluated before activation.

## Dependencies

- v1.8 provenance and evidence
- v1.7 policy

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Tampering and revocation fail closed.
- Variables are schema-validated.
- Rules cannot broaden higher-level authority.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Prompt injection in imported assets.
- Licensing or provenance ambiguity.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
