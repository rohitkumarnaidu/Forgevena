# v1.4.0 — Production Provider Platform

> **Purpose:** Defines the mandatory security, privacy, safety, quality, accessibility, and performance evidence.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Provider Platform Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#7-v140--production-provider-platform`
> **Lifecycle:** implementation-preview
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

- OpenAI, Anthropic, Gemini, OpenRouter, and Ollama adapters pass deterministic fixtures and credential-gated smoke tests.
- Retries honor Retry-After, deadlines, cancellation, budgets, and idempotency.
- Prompts, responses, credentials, and authorization headers are absent from logs and diagnostics.
