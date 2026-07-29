# v1.6.0 — Template Packages and Native Distribution

> **Purpose:** Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Template and Distribution Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#9-v160--template-packages-and-native-distribution`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Required Decisions

- Architecture and trust-boundary ADRs must be approved before implementation.
- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.

## Assumptions

- Template assets remain additive and content-addressed.
- Native package channels keep external moderation authority.

## Open Questions

- Which inheritance patterns remain deterministic?
- How are abandoned template publishers handled?

## Decision Expiry

Unresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.
