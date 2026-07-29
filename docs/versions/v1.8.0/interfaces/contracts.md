# v1.8.0 — Observability, Supply Chain, and Documentation

> **Purpose:** Defines version-level CLI, API, SDK, dashboard, schema, and compatibility obligations.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Operations, Security, and Documentation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#11-v180--observability-supply-chain-and-documentation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Contract Rules

- Preserve `forgevena`, `ai-workspace`, `.ai-workspace/`, structured envelopes, preview-first mutation, and explicit external consent.
- Add interfaces only through versioned schemas and shared domain services.
- Document authentication references, permissions, rate limits, pagination, errors, idempotency, cancellation, and compatibility.
- Never place credentials or sensitive content in arguments, URLs, logs, state, diagnostics, or evidence.

## Surface Impact

- Version diagnostics, retention, audit export, SBOM, provenance, performance baseline, and documentation manifest schemas.
- Add health, bundle, metrics, profile, evidence verification, and update-center surfaces.

## Compatibility

Backward compatibility is required throughout 1.x. Later breaking changes require deprecation, migration preview, compatibility reports, rollback, and support for the final prior-major release.
