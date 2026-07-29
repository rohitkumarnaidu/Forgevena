# v2.1.0 — ForgeRegistry Protocol Foundation

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeRegistry Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v210--forgeregistry-protocol-foundation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Establish open package, manifest, namespace, lockfile, trust, cache, and deterministic resolver contracts for all capabilities.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Canonical Capability Package:** Define immutable packages containing independently identified capabilities, releases, permissions, compatibility, provenance, and evidence.
- **Deterministic Local Registry:** Resolve, lock, cache, verify, import, export, and roll back capability packages fully offline.

## Candidates

- None approved.

## Non-Goals

- No public marketplace or mandatory remote registry.
- No arbitrary unsandboxed package lifecycle code.

## Success Metrics

- Resolution and lockfiles are deterministic.
- Offline import/export and verification are complete.
- Dependency confusion and corruption fail closed.
