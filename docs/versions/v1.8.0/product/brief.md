# v1.8.0 — Observability, Supply Chain, and Documentation

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Operations, Security, and Documentation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#11-v180--observability-supply-chain-and-documentation`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Make runtime health, release integrity, documentation authority, and operational evidence reproducible and privacy-safe.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Safe Local Observability:** Provide structured logs, metrics, traces, diagnostics, crash reports, health summaries, and performance profiles.
- **Supply Chain and Documentation Evidence:** Generate and verify SBOMs, provenance, checksums, attestations, threat checklists, and canonical references.

## Candidates

- None approved.

## Non-Goals

- No default telemetry or collection of prompts, responses, keys, tokens, or source content.
- No unsupported certification claim from generated evidence.

## Success Metrics

- Diagnostic bundles pass secret and content exclusion tests.
- Release hashes reproduce from signed evidence.
- Documentation generation has zero authority drift.
