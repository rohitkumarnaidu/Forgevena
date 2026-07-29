# v1.9.0 — Signed Skills and Deterministic Workflows

> **Purpose:** Defines the mandatory security, privacy, safety, quality, accessibility, and performance evidence.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Workflow and Engineering Assets Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#12-v190--signed-skills-and-deterministic-workflows`
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

- Chains, DAGs, state machines, bounded loops, retries, cancellation, compensation, and checkpoints pass.
- Mutating nodes require preview, policy, ownership, and consent.
- Budgets and termination conditions stop runaway work.
