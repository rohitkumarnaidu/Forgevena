# v1.7.0 — Local Organization Governance

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Governance and Policy Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#10-v170--local-organization-governance`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Enforce signed, portable organization policy bundles without requiring a server or account.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Signed Organization Policy Bundles:** Define organizations, principals, roles, permissions, approved artifacts, and capability rules in signed local bundles.
- **Policy Simulation and Compliance:** Explain effective policy, detect bypass paths, and export metadata-only audit and compliance evidence.

## Candidates

- None approved.

## Non-Goals

- No mandatory hosted identity or control plane.
- No alternate CLI path may bypass policy.

## Success Metrics

- Every external-effect boundary invokes policy evaluation.
- Policy decisions are deterministic and explainable.
- Bundles remain portable, signed, and usable offline.
