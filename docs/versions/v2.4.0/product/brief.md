# v2.4.0 — Publisher Platform and Ecosystem SDK

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Publisher Platform Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v240--publisher-platform-and-ecosystem-sdk`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Enable governed package building, validation, signing, staged publication, deprecation, withdrawal, and publisher recovery.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Capability Studio and SDK:** Provide one schema-driven builder with profiles for agents, workflows, knowledge, tools, interfaces, templates, packages, and evaluations.
- **Governed Publisher Lifecycle:** Support identity, staged publishing, ownership, recovery, disputes, vulnerabilities, deprecation, withdrawal, and revocation.

## Candidates

- None approved.

## Non-Goals

- No duplicated builder implementation per capability type.
- No payment, tax, payout, or unrestricted executable publication.

## Success Metrics

- SDK fixtures are deterministic and cross-platform.
- Every publication is signed and staged.
- Publisher ownership and recovery operations are auditable.
