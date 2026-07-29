# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Defines the mandatory security, privacy, safety, quality, accessibility, and performance evidence.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
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

- Global, organization, workspace, project, shared, and read-only scope precedence passes.
- Install, update, remove, rollback, health, and history are fully evidenced.
- Ranking is explainable, neutral, and policy-aware.
