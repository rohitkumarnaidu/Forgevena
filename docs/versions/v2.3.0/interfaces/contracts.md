# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Defines version-level CLI, API, SDK, dashboard, schema, and compatibility obligations.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Contract Rules

- Preserve `forgevena`, `ai-workspace`, `.ai-workspace/`, structured envelopes, preview-first mutation, and explicit external consent.
- Add interfaces only through versioned schemas and shared domain services.
- Document authentication references, permissions, rate limits, pagination, errors, idempotency, cancellation, and compatibility.
- Never place credentials or sensitive content in arguments, URLs, logs, state, diagnostics, or evidence.

## Surface Impact

- Version search, package detail, review, collection, installation scope, compatibility, update plan, and lifecycle history contracts.
- Add hub search, agents, collections, reviews, recommendations, and package lifecycle commands and dashboard views.

## Compatibility

Backward compatibility is required throughout 1.x. Later breaking changes require deprecation, migration preview, compatibility reports, rollback, and support for the final prior-major release.
