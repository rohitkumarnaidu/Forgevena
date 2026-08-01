# v1.5.0 — Isolated Plugin and MCP Ecosystem

> **Purpose:** Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Plugin and MCP Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#8-v150--isolated-plugin-and-mcp-ecosystem`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Required Decisions

- Architecture and trust-boundary ADRs must be approved before implementation.
- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.

## Assumptions

- Worker processes provide the initial portable isolation boundary.
- Vendor formats remain projections, not canonical package truth.

## Open Questions

- None.

## Decision Expiry

Unresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.
