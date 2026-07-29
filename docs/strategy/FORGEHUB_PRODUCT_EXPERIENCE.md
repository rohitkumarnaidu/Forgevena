# ForgeHub Product Experience

> **Status:** Strategic experience specification; surfaces remain conditional on Evidence Funnel approval.

## Experience Principles

ForgeHub is consistent across CLI, local dashboard, IDE bridges, organization views, and optional managed services because all surfaces call shared domain contracts. It is accessible, keyboard-operable, explainable, preview-first, and usable offline.

## Core Journeys

1. Discover a capability by task, type, compatibility, policy, publisher, or evidence.
2. Inspect permissions, dependencies, trust, support, license, versions, and known risks.
3. Preview resolution, source selection, scope, file changes, external effects, and rollback.
4. Install after policy and human approval; retain lockfile and ownership evidence.
5. Monitor health, advisories, compatibility, drift, and updates.
6. Update, repair, roll back, or remove without touching unmanaged assets.
7. Publish through validation, signing, staged promotion, and moderation.

## Future CLI Families

```text
forgevena registry <init|add|remove|sync|mirror|verify|doctor>
forgevena package <search|info|install|remove|update|verify|repair|rollback>
forgevena hub <search|recommend|marketplace|reviews|publisher>
forgevena publish <validate|sign|test|preview|submit|deprecate|withdraw>
forgevena trust <publisher|package|signature|provenance|revocation>
forgevena ecosystem <status|health|usage|history|export|import>
forgevena package <import|convert|export>
forgevena hub <agents|collections|reviews>
forgevena ecosystem <recommendations>
forgevena builder <profile>
```

These are roadmap interfaces, not current CLI commitments. Mutations preserve `--apply`, explicit consent, structured envelopes, and stable errors.

## Dashboard and IDE

The dashboard presents projects, organizations, installed capabilities, security findings, compatibility, evidence, update plans, release state, and audit history. IDE bridges for VS Code, JetBrains, Cursor, Codex, and compatible hosts use the same plans and policy decisions; they do not duplicate domain logic.

### Information Architecture

ForgeHub provides coherent areas rather than independent products:

- **AgentSpace:** agents, subagents, teams, collections, evaluations, health, and run evidence.
- **Capability Manager:** definitions, packages, installations, configurations, activations, ownership, and lifecycle actions.
- **Registry Explorer:** sources, namespaces, mirrors, trust roots, synchronization, quarantine, and availability.
- **Import and Conversion:** source detection, quarantine, compatibility analysis, conversion evidence, manual adaptation, and export.
- **Dependency and Permission Graphs:** selected versions, transitive authority, conflicts, data flow, and rollback impact.
- **Security, Compatibility, Update, and Health Centers:** advisories, evidence expiry, drift, remediation plans, and last-known-good state.
- **Publisher and Community Centers:** identity, releases, support, reviews, moderation, appeals, collections, and succession.
- **Project, Workspace, and Organization Views:** installed inventory, policy, usage history, local audit, shared distributions, and approved catalogs.

Local usage history records operation metadata, outcomes, versions, health, and evidence references under configurable retention. It is not telemetry and excludes prompts, responses, source content, secrets, and behavioral profiles.

## Search and Ranking

Ranking factors are documented and inspectable. Organic results prioritize compatibility, policy, maintenance, evidence freshness, accessibility, and task fit. Sponsorships are visually distinct and never modify trust status or organic ranking.

### Explainable Recommendations

Recommendations use approved local metadata: declared project type and stack, policy, installation inventory, compatibility, dependency fit, evidence freshness, and user-controlled preferences. Every recommendation includes a rationale, policy result, source and evidence dates, compatibility, dependency and permission impact, and dismissal controls.

Recommendation generation is read-only. It cannot install, activate, update, transmit project data, or create a publisher relationship. Source-content profiling, hidden sponsored influence, behavioral advertising, and mandatory managed analytics are prohibited.

Recommendation feedback stays local unless the user separately authorizes a documented, minimal, revocable analytics purpose. Dismissal and deletion must be possible without degrading core operation.

## Accessibility

Public surfaces target WCAG 2.2 AA, keyboard and screen-reader operation, reduced motion, high contrast, localization readiness, understandable errors, and accessible security disclosures. Accessibility evidence expires and is revalidated after material UI changes.

## Capability Studio and Host Experience

The Studio follows one shared lifecycle: select a profile, define semantics, declare permissions and data flows, simulate policy, test, evaluate, document, package, sign, preview publication, export compatibility, and rehearse rollback.

Host-adapter research covers Claude, Cursor, Codex, OpenCode, Antigravity, Hermes, Gemini CLI, Windsurf, Cline, Aider, VS Code and Copilot, JetBrains, desktop agents, cloud agents, and generic MCP or Agent Skills hosts. These are research targets until dated fixtures and smoke evidence exist.

Every host view exposes the translation result and loss report. A `degraded` result requires acknowledgement; `unsupported` stops the operation rather than silently dropping functionality.

Source import follows the [External Ecosystem Import and Conversion Strategy](../architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md). GitHub repositories, npm or PyPI packages, OpenSpec material, external catalogs, and vendor formats are acquisition sources, not automatically valid capabilities.

## Success Metrics

Task completion, reproducible install rate, recovery rate, time to understand permissions, search relevance, accessibility conformance, update success, rollback success, and support burden. Engagement is not optimized through dark patterns.
