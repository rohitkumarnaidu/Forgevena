# v2.0.0 — Optional Self-Hosted Organization Control Plane

> **Purpose:** Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Control Plane Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#14-v200--optional-self-hosted-organization-control-plane`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Required Decisions

- Architecture and trust-boundary ADRs must be approved before implementation.
- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.

## Assumptions

- The local platform is enterprise-ready before server implementation begins.
- Self-hosting is a first-class deployment model.

## Open Questions

- Which data classes may synchronize by policy?
- What consistency model balances offline autonomy and fleet governance?

## Decision Expiry

Unresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.
