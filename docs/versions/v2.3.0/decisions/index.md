# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Required Decisions

- Architecture and trust-boundary ADRs must be approved before implementation.
- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.

## Assumptions

- ForgeRegistry is the sole package authority.
- Forgevena Core retains runtime and policy authority.

## Open Questions

- How are review abuse and publisher disputes appealed?
- Which installation scopes can inherit or pin versions?

## Decision Expiry

Unresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.
