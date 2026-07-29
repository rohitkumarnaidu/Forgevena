# v2.2.0 — ForgeRegistry Federation and Enterprise Registries

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeRegistry Federation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v220--forgeregistry-federation-and-enterprise-registries`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Support trusted public, private, mirrored, federated, and air-gapped registries without making any registry mandatory.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Federated Registry Sources:** Add public, private, mirrored, and organization registry sources with deterministic trust and precedence.
- **Air-Gap, Revocation, and Continuity:** Export signed offline bundles, propagate revocations, quarantine risk, and preserve last-known-good operation.

## Candidates

- None approved.

## Non-Goals

- No mandatory public registry or opaque global namespace authority.
- No fail-open mirror or signature behavior.

## Success Metrics

- Mirror selection and conflict behavior are deterministic.
- Revocation propagates within defined SLOs.
- Air-gapped promotion remains independently verifiable.
