# v1.6.0 — Template Packages and Native Distribution

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Template and Distribution Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#9-v160--template-packages-and-native-distribution`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Move templates into signed, independently versioned packages and certify reproducible generation and native distribution.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Versioned Template Packages:** Package templates with schemas, assets, hashes, lockfiles, tests, compatibility, inheritance, and signatures.
- **Catalog and Native Distribution:** Support signed local and consent-gated HTTPS catalogs plus verified Homebrew, Winget, and Chocolatey outputs.

## Candidates

- None approved.

## Non-Goals

- No automatic overwrite of existing project files.
- No unsigned remote catalog activation or cloud-provider lock-in.

## Success Metrics

- Every built-in template generates on Windows, Ubuntu, and macOS.
- Generated lockfiles, Docker, CI, security, tests, and documentation validate.
- Catalog verification works fully offline.
