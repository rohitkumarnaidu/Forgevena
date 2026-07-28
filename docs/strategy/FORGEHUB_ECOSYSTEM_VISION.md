# ForgeHub Ecosystem Vision

> **Status:** Strategic target; not implementation authorization. Every capability must pass the Evidence Funnel, RFC, ADR, threat model, and change-readiness gate.

## Purpose

ForgeHub is the user-facing ecosystem for discovering, evaluating, installing, updating, reviewing, publishing, and governing Forgevena capabilities. It is built on ForgeRegistry contracts and never replaces the complete local client.

## Users and Problems

- Developers need trustworthy discovery without manually evaluating scattered repositories.
- Platform teams need approved catalogs, policy-controlled installation, compatibility evidence, and inventory.
- Publishers need deterministic validation, signing, staged promotion, support metadata, and recovery procedures.
- Security teams need provenance, revocation, vulnerability, moderation, and audit evidence.
- Air-gapped organizations need the same lifecycle through signed offline bundles.

## Product Experience

ForgeHub spans the `forgevena` CLI, local dashboard, IDE bridges, optional organization surfaces, and an optional hosted service. Search results expose publisher identity, compatibility date, support status, licenses, signatures, provenance, vulnerabilities, permissions, dependencies, and ranking rationale before installation.

Installation remains preview-first. Users select an explicit scope, review policy and dependency impact, approve external effects, and receive ownership, health, update, rollback, and uninstall evidence.

## Ecosystem Participants

- Consumers, workspace owners, and organization administrators.
- Individual, community, verified, and organization publishers.
- Registry operators, mirror operators, moderators, and security responders.
- Compatibility laboratories and independent rebuild verifiers.
- Maintainers of providers, plugins, MCP servers, templates, skills, workflows, and extensions.

## Product Boundary

| Layer | Permanent boundary |
| --- | --- |
| Open | Protocols, package formats, local registry, resolver, CLI, SDK, offline verification, and local discovery. |
| Enterprise | Private registries, approvals, compliance packs, fleet governance, policy distribution, and long-term support. |
| Managed | Optional hosted discovery, managed registries, publisher services, ecosystem operations, and consented analytics. |

No account, hosted dependency, telemetry, behavioral advertising, or paid ranking is required. Sponsorship must be clearly labelled and never alter organic trust evidence.

## Success Metrics

- Verified installation, update, rollback, and uninstall success by platform and capability type.
- Median time from discovery to a policy-approved reproducible install.
- Compatibility freshness, vulnerability-response time, and revocation propagation time.
- Search accessibility, documentation task success, publisher onboarding success, and moderator load.
- Percentage of recommendations with inspectable evidence and rationale.
- Zero hidden ranking influence and zero mandatory data collection.

## Risks and Controls

- **Malicious packages:** sandboxing, signatures, provenance, scanning, quarantine, and revocation.
- **Dependency confusion and typosquatting:** namespace ownership, source pinning, similarity detection, and policy.
- **Centralization:** portable protocols, mirrors, federation, export, and no mandatory public registry.
- **Unsupported trust claims:** dated evidence, expiry, appeal, and explicit certification limits.
- **Maintainer burnout:** ownership transfer, succession, review-load metrics, and funded operations.

## Non-Goals

- Replacing Git hosts, language package managers, IDEs, or cloud marketplaces.
- Executing arbitrary package scripts without sandboxing, declared permissions, policy, and consent.
- Treating popularity, reviews, or a composite score as a security guarantee.
- Collecting source content or behavioral profiles for recommendations.

## Capability Ecosystem Experience

ForgeHub includes a **Capability Studio** area, not a separate Capability Hub product. It discovers and presents packages, capability definitions, compatibility and translation evidence, permissions, data classes, maturity, support, evaluations, and installation scopes. Popularity never implies safety, and installation never implies activation authority.

One schema-driven Studio provides specialized profiles for agents and teams; skills, prompts, and rules; workflows; knowledge and memory; tools and integrations; UI extensions; templates; and publishing. All profiles reuse validation, threat review, permission previews, evaluation, signing, and rollback. The canonical model is defined in the [Enterprise Capability System](../architecture/ENTERPRISE_CAPABILITY_SYSTEM.md).

### AgentSpace

AgentSpace is ForgeHub's focused agents-and-teams experience. It is not a separate product pillar, package registry, policy engine, or runtime. It presents canonical agent capabilities through shared ForgeHub discovery and lifecycle contracts while Forgevena Core retains execution authority and ForgeRegistry retains package authority.

AgentSpace covers agents, subagents, teams, profiles, collections, bundles, dependencies, versions, evaluations, documentation, compatibility, health, and metadata-only run evidence. Its governed journeys are discover, inspect, install, configure, evaluate, activate, run, fork, export, update, roll back, deprecate, and retire. Each action displays scope, ownership, permissions, data flow, compatibility, policy, consent, and rollback implications.

Forking creates a new publisher-owned capability identity with lineage; it never rewrites the source release. Collections are dependency declarations, not hidden permission aggregation. Installation never implies activation or permission to run.

### Community and Collaboration

Reviews are version-scoped and distinguish verified use from unverified commentary without disclosing private usage. Publishers may respond, correct metadata, and appeal moderation. Anti-abuse controls address coordinated manipulation, harassment, fraudulent reviews, spam, and undisclosed sponsorship.

Popularity, download counts, ratings, collections, and publisher verification are discovery signals only. They never become security, compatibility, or enterprise-certification guarantees.

## Proposal Reconciliation

| Proposal concept | Classification | Canonical treatment |
| --- | --- | --- |
| ForgeHub ecosystem | Already covered | User-facing discovery, publishing, lifecycle, and governance experience over ForgeRegistry. |
| AgentSpace | Strengthened | ForgeHub area for agents and teams; not a separate registry, runtime, or product authority. |
| Builder Center | Renamed and consolidated | Capability Studio provides one schema-driven builder with specialized profiles. |
| Unified capability model | Already covered | Enterprise Capability System defines lifecycle objects, taxonomy, facets, and authority. |
| Global and project reuse | Strengthened | Explicit installation scopes, precedence, ownership, inheritance, conflicts, and rollback. |
| Import and package conversion | Newly documented | Source Adapters, Host Adapters, and Converters use quarantine, compatibility, loss, and permission-delta evidence. |
| Registry federation | Already covered | ForgeRegistry provides public, private, mirrored, regional, and air-gapped federation. |
| Marketplace, dashboard, and history | Strengthened | ForgeHub information architecture covers management, evidence, local audit history, community, and health. |
| Recommendation engine | Strengthened | Local-first, policy-aware, explainable recommendations with no source profiling or hidden ranking. |
| Reviews, ratings, forks, and collections | Deferred and bounded | Version-scoped reviews and governed lineage are planned; reputation automation remains in the Evidence Funnel. |
| Security, quality, and community scores | Rejected as composite guarantees | Independent dated evidence dimensions replace misleading universal scores. |
| Universal automatic conversion | Rejected | Unsupported and manual-adaptation outcomes remain first-class and fail visibly. |
| Commercial transactions and cross-organization agents | Deferred | Evidence Funnel opportunities requiring legal, security, privacy, and operating-model approval. |

This classification prevents strategy documents from duplicating existing authority or converting ambitious ideas into unsupported release commitments.

## Dependencies and Gates

ForgeHub depends on the `v1.4–v2.0` contracts and ForgeRegistry `v2.1–v2.2`. Public preview requires registry portability, policy enforcement, scoped ownership, rollback, moderation, accessibility, privacy, and incident-response evidence.
