# v1.8.0 — Observability, Supply Chain, and Documentation

> **Purpose:** Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Operations, Security, and Documentation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#11-v180--observability-supply-chain-and-documentation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Required Decisions

- Architecture and trust-boundary ADRs must be approved before implementation.
- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.

## Assumptions

- Local observability is complete without hosted services.
- Evidence metadata is sufficient for routine diagnostics.

## Open Questions

- Which trace formats are stable public contracts?
- What retention defaults balance diagnosis and privacy?

## Decision Expiry

Unresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.
