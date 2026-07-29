# v2.0.0 — Optional Self-Hosted Organization Control Plane

> **Purpose:** Defines version-level CLI, API, SDK, dashboard, schema, and compatibility obligations.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Control Plane Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#14-v200--optional-self-hosted-organization-control-plane`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Contract Rules

- Preserve `forgevena`, `ai-workspace`, `.ai-workspace/`, structured envelopes, preview-first mutation, and explicit external consent.
- Add interfaces only through versioned schemas and shared domain services.
- Document authentication references, permissions, rate limits, pagination, errors, idempotency, cancellation, and compatibility.
- Never place credentials or sensitive content in arguments, URLs, logs, state, diagnostics, or evidence.

## Surface Impact

- Version synchronization, tenant, identity, policy distribution, conflict, audit retention, and disaster-recovery APIs.
- Add previewable enrollment, sync, status, conflict, export, disconnect, and rollback flows.

## Compatibility

Backward compatibility is required throughout 1.x. Later breaking changes require deprecation, migration preview, compatibility reports, rollback, and support for the final prior-major release.
