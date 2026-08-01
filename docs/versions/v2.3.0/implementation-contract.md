# v2.3.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Appeals:** reviews and moderation actions are version-scoped, evidence-backed, and appealable. Publisher disputes enter a documented queue with independent reviewer assignment, conflict-of-interest disclosure, response deadlines, reversible interim actions, and a public outcome summary that excludes private evidence.
- **Scope precedence:** effective installation order is session restriction, project pin, workspace pin, organization policy pin, shared read-only distribution, then global default. Lower scopes may select an allowed compatible version but cannot bypass organization blocks, trust, or permissions. Conflicts are reported; silent replacement is prohibited.

## ForgeHub and AgentSpace

ForgeHub is discovery and lifecycle UX over ForgeRegistry; it never owns runtime or package authority. AgentSpace is a ForgeHub area for agents, teams, evaluations, collections, compatibility, and execution evidence. Capability Studio remains the schema-driven builder experience.

Journeys cover search, inspect, compare, plan install, approve permissions, install, configure, validate, activate, run, health, update, rollback, disable, remove, fork, export, review, report, and retire. Every page and command shows publisher identity, package/version, signatures, provenance, permissions, dependencies, compatibility freshness, support, vulnerabilities, policy result, affected scope, and rollback limits.

## Community, Ranking, and Accessibility

Reviews require verified-use evidence where claimed and attach to a specific version. Abuse controls include rate limits, reporting, moderation, appeals, publisher responses, anti-brigading signals, and privacy protection. Ranking is explainable and separates relevance, compatibility, maintenance, and community activity. Hidden sponsorship and behavioral advertising are prohibited.

All experiences meet keyboard, screen-reader, focus, contrast, reduced-motion, localization, error-recovery, and responsive requirements. Local usage history remains on-device unless explicit synchronization consent exists.

## Verification

Tests cover scope conflicts, policy denial, stale evidence, inaccessible packages, rollback, malicious descriptions, review abuse, moderation appeal, publisher response, ranking manipulation, empty/degraded/offline states, and WCAG 2.2 AA flows. `v2.3.0` is done when installs are reproducible, ownership is precise, interfaces are accessible, and no ForgeHub path bypasses Core policy or Registry trust.

## Scope, Ownership, Inputs, and Outputs

ForgeHub Product Maintainers own `forgehub-lifecycle-experience` and `agentspace-collections-community`. Inputs are verified Registry metadata, Core policy decisions, compatibility evidence, publisher identity, user queries, installation scope, local history, and moderation records. Outputs are accessible discovery results, explainable rankings, installation plans, collection manifests, review state, update plans, rollback options, and local history. UI events never become package authority; every mutation routes through Core and every package fact routes through ForgeRegistry.

## Security, Permissions, and Data Flow

Discovery permission does not imply install or run permission. Data flow minimizes search and local-use metadata, keeps local history on-device by default, and excludes source content, credentials, and private package existence. Reviews are version-scoped and retain moderation history according to policy. Human approval is required for installation, update, activation, scope change, external sharing, review publication, and analytics consent. Accessibility, anti-abuse, publisher response, and appeal controls apply equally across CLI, dashboard, and IDE surfaces.

## Failure, Recovery, Migration, and Rollback

Unavailable ForgeHub degrades to local Registry and installed-package management. Recovery rebuilds views from canonical Registry and Core state rather than cached ranking. Migration preserves collections, reviews, local history, and scope ownership through reversible schemas. Rollback restores the previous verified package graph and user-experience contract; roll-forward replays compatible view events. Kill switches disable recommendations, reviews, publishing, or remote discovery independently without blocking local package inspection.

## Service Objectives and Capacity

Search indexing, moderation automation, and optional remote discovery operate within an explicit compute and network cost budget.

Search has a service level objective of p95 below 500 ms for 1,000,000 package releases, local installed-package views below 100 ms, and update planning below 2 seconds for 1,000 dependencies. Accessibility requires 100% keyboard completion of critical journeys and zero critical WCAG 2.2 AA violations. Moderation queues apply rate limits and a 2-business-day response target for urgent abuse reports. Health reports index freshness, policy availability, registry reachability, moderation backlog, and degraded local-only mode.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover malicious metadata, typosquatting, scope conflict, stale compatibility, inaccessible packages, ranking manipulation, review abuse, appeal, publisher response, offline mode, screen readers, localization, and degraded dependencies. Acceptance evidence includes reproducible install traces, permission previews, accessibility audit, moderation exercise, ranking explanations, rollback proof, and local-history privacy review. The evidence owner is ForgeHub Product Maintainers; release and moderation-decision evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must not infer package safety, publisher trust, install scope, compatibility, review authenticity, ranking weight, or analytics consent. Unsupported evidence and ambiguous ownership must fail closed. The agent may summarize and recommend, but installation, update, publication, scope changes, moderation actions, and external sharing require human approval.
