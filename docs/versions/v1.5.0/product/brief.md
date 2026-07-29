# v1.5.0 — Isolated Plugin and MCP Ecosystem

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Plugin and MCP Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#8-v150--isolated-plugin-and-mcp-ecosystem`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Execute extensions out of process with deny-by-default permissions, signed manifests, bounded resources, and governed source and host adaptation.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Isolated Plugin Runtime:** Run signed plugins in bounded worker processes using versioned JSON-RPC.
- **MCP, Source, and Host Adapter Foundation:** Inspect external sources and translate supported capability bundles through explicit compatibility and loss reports.

## Candidates

- None approved.

## Non-Goals

- No in-process untrusted execution.
- No raw credentials or unrestricted lifecycle scripts for plugins.

## Success Metrics

- A failed or malicious plugin cannot crash or corrupt the host.
- Every permission denial and lifecycle action is auditable.
- Compatibility claims require dated import/export fixtures.
