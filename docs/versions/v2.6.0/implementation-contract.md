# v2.6.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Recommendation quality:** measured with consented deterministic relevance fixtures, task-success studies, compatibility precision/recall, harmful-recommendation rate, dismissal rate, and explanation usefulness. No source-content profiling, cross-organization behavioral tracking, or hidden engagement optimization is permitted.
- **Exact host support:** a HostAdapter is `exact` only when import/export round trips preserve semantics, permissions, configuration, lifecycle, errors, data handling, cancellation, and rollback across dated fixtures. Otherwise support is labelled `translated`, `degraded`, `manual-adaptation`, or `unsupported` with a loss report.

## Intelligence Contract

Recommendations use declared stack, local metadata, policy, installed capabilities, compatibility, dependency fit, freshness, support, and explicit preferences. Every recommendation includes rationale, evidence IDs and dates, confidence, policy result, compatibility, permission and dependency impact, alternatives, and dismissal controls. Sponsorship, when ever allowed, is visibly labelled and never changes safety or policy ranking.

Dependency intelligence detects unused, duplicate, conflicting, stale, revoked, unsupported, and risky capabilities. Update plans remain preview-only and include lockfile changes, migrations, affected scopes, tests, rollback, and downtime expectations.

## Host and Experience Bridges

VS Code, JetBrains, Cursor, Codex, and compatible hosts call shared Core domain APIs. Adapters expose probe, capabilities, import, normalize, validate, planExport, export, planInstall, verify, health, and planRemove. Unsupported primitives fail visibly. IDEs cannot bypass policy, consent, vault, audit, or managed ownership.

Analytics are off by default, local where possible, field-level documented, revocable, exportable, and deletable. Dashboard views cover projects, organizations, capabilities, security, compatibility, history, and releases with WCAG 2.2 AA behavior.

## Verification

Tests cover recommendation bias, stale evidence, policy conflicts, malicious metadata, privacy leakage, consent withdrawal, adapter loss, unsupported hosts, round trips, accessibility, offline mode, and dashboard degradation. `v2.6.0` is done when recommendations are explainable, host claims have dated fixtures, and no intelligence path collects source content or bypasses authority.

## Scope, Ownership, Inputs, and Outputs

Every recommendation, dismissal, consent, probe, translation, and export event records evidence freshness, policy result, and operation ID.

ForgeHub Intelligence Maintainers own `explainable-ecosystem-intelligence` and `shared-host-bridges`. Inputs are local project metadata, installed capability graphs, policy results, dated compatibility evidence, host probes, user preferences, and explicit analytics consent. Outputs are evidence-linked recommendations, dependency and permission explanations, host translation plans, loss reports, accessible dashboard views, and revocable local analytics records. Recommendation state is `candidate`, `evidence-linked`, `policy-filtered`, `presented`, `dismissed`, or `accepted`; host state is `native`, `exact`, `translated`, `degraded`, or `unsupported`.

## Security, Permissions, and Data Flow

Recommendation permission never grants installation or execution permission. Data flow uses metadata only by default and excludes source content, prompts, responses, credentials, private registry existence, and identity unless separately approved. Analytics retention, deletion, export, and residency are field-level and consent-bound. Human approval is required before enabling analytics, exporting host configuration, installation, update, or any external request. Host adapters cannot bypass Core policy, consent, vault, audit, or managed ownership.

## Failure, Recovery, Migration, and Rollback

Stale or missing evidence removes support claims instead of guessing. Recovery rebuilds recommendations from local canonical metadata and re-probes hosts. Migration preserves dismissals, consent, adapter mappings, and loss reports with reversible schemas. Rollback restores the prior adapter or recommendation model; roll-forward regenerates derived recommendations after compatibility verification. Kill switches disable analytics, recommendations, individual hosts, or remote compatibility refresh independently.

## Service Objectives and Capacity

Local recommendations have a service level objective of p95 below 500 ms for 10,000 capabilities, host probing below 2 seconds per host, and dashboard interaction below 100 ms for cached views. Recommendation generation has a cost budget of zero external calls by default. Compatibility evidence expires after 90 days for changing hosted systems unless stricter policy applies. Health reports evidence age, adapter status, loss severity, consent state, index freshness, and degraded offline behavior.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover bias, stale evidence, policy conflict, malicious metadata, consent withdrawal, privacy leakage, unsupported hosts, lossy round trips, inaccessible UI, offline mode, and dashboard degradation. Acceptance evidence includes recommendation rationale, policy trace, dated host fixtures, loss reports, privacy review, consent deletion proof, accessibility audit, and rollback validation. The evidence owner is ForgeHub Intelligence Maintainers; release compatibility evidence retention is permanent and local analytics retention remains policy-bound.

## AI-Agent Implementation Rules

An AI coding agent must not infer compatibility, recommendation value, host support, consent, permission, or safety from popularity. Missing evidence, unsupported translation, privacy ambiguity, or policy denial must fail closed. The agent may explain recommendations and generate previews, but installation, host export, analytics enablement, and external calls require human approval.
