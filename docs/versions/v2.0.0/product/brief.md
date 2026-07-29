# v2.0.0 — Optional Self-Hosted Organization Control Plane

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Control Plane Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#14-v200--optional-self-hosted-organization-control-plane`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Add an optional self-hostable control plane while preserving complete local operation during outages and without accounts.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Self-Hosted Organization Control Plane:** Distribute signed policy and catalogs, retain audit evidence, and manage fleet inventory through an optional service.
- **Encrypted Conflict-Aware Synchronization:** Synchronize approved registries, policies, inventory, and audit records with deterministic conflict resolution.

## Candidates

- None approved.

## Non-Goals

- No mandatory account, telemetry, network dependency, or hosted-only local feature.
- No silent upload of source, prompts, responses, credentials, or local diagnostics.

## Success Metrics

- Offline clients continue operating through control-plane outages.
- Tenant isolation and authorization tests have no high findings.
- Synchronization conflicts are deterministic, auditable, and recoverable.
