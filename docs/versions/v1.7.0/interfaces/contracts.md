# v1.7.0 — Local Organization Governance

> **Purpose:** Defines version-level CLI, API, SDK, dashboard, schema, and compatibility obligations.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Governance and Policy Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#10-v170--local-organization-governance`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Contract Rules

- Preserve `forgevena`, `ai-workspace`, `.ai-workspace/`, structured envelopes, preview-first mutation, and explicit external consent.
- Add interfaces only through versioned schemas and shared domain services.
- Document authentication references, permissions, rate limits, pagination, errors, idempotency, cancellation, and compatibility.
- Never place credentials or sensitive content in arguments, URLs, logs, state, diagnostics, or evidence.

## Surface Impact

- Version organization, role, policy, overlay, decision, approval, and compliance schemas.
- Add policy simulation, explanation, signing, import, export, audit, and compliance commands.

## Compatibility

Backward compatibility is required throughout 1.x. Later breaking changes require deprecation, migration preview, compatibility reports, rollback, and support for the final prior-major release.
