# v1.5.0 — Isolated Plugin and MCP Ecosystem

> **Purpose:** Defines the mandatory security, privacy, safety, quality, accessibility, and performance evidence.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Plugin and MCP Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#8-v150--isolated-plugin-and-mcp-ecosystem`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Threat and Privacy Review

Threat modeling covers trust boundaries, identity, authorization, secrets, data egress, supply chain, abuse, denial of service, rollback, and incident recovery. Data classification covers collection, purpose, retention, deletion, residency, export, and revocation.

## AI Safety and Human Authority

AI-assisted behavior is bounded, explainable, cancellable, budgeted, evaluated with deterministic fixtures, and read-only by default. Mutation, deployment, billing, publication, credential use, and policy changes require explicit human authority.

## Quality Gates

- Critical security, privacy, policy, trust, migration, rollback, and contract controls: **100%**.
- Important architecture, API, operations, accessibility, and release controls: **95%**.
- Standard quality and developer-experience controls: **90%**.
- No overall score compensates for a mandatory failure.

## Version Acceptance Gates

- Malformed RPC, hangs, crashes, output floods, dependency cycles, signature failures, and rollback are tested.
- Unsigned plugins remain disabled unless explicitly approved.
- MCP authentication, transport, capability, and health policies fail closed.
