# Forgevena Innovation Opportunity Portfolio

> **Status:** Discovery portfolio; not committed release scope.
>
> **Authority:** Ideas advance only through the [Evidence Funnel](../ENGINEERING_GOVERNANCE.md). This portfolio does not change the approved dependency order in the [Versioned Product Roadmap](FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md).

## Portfolio Rules

- Every opportunity begins at `Signal` or `Discovery` with a maintainer owner and annual review.
- No opportunity receives a version, public compatibility promise, or implementation authorization before RFC and architecture approval.
- Experiments must preserve the [Platform Constitution](PLATFORM_CONSTITUTION.md), reuse existing state, policy, provider, plugin, audit, and consent contracts, and remain disabled by default.
- Research stops when value is unproven, risk is disproportionate, maintenance is unsustainable, or existing tools solve the problem better.

## Opportunity Register

| Opportunity | Stage | Primary value | Evidence required before RFC | Principal risks | Owner | Review cadence |
| --- | --- | --- | --- | --- | --- | --- |
| Trust Center and Evidence Graph | Discovery | Connect requirements, decisions, code, tests, policy, releases, SBOMs, vulnerabilities, and approvals into verifiable evidence. | Evidence-consumer interviews, graph schema prototype, provenance threat model, query success benchmark. | False assurance, stale links, sensitive metadata aggregation. | Maintainers | Annual |
| Project Digital Twin | Discovery | Metadata-only model of architecture, dependencies, ownership, environments, risks, and release state. | Metadata minimization study, index reuse proof, drift benchmark, deletion model. | Privacy leakage, stale models, duplicated indexes. | Maintainers | Annual |
| Compatibility Laboratory | Discovery | Continuously certify providers, plugins, MCP, templates, operating systems, shells, and package channels. | Representative matrix, fixture design, account-cost model, evidence-expiry policy. | Cost, flaky external tests, misleading certification. | Maintainers | Annual |
| Engineering Capsule | Signal | Reproducible signed offline bundles of configuration, policy, tools, docs, and evidence. | Air-gap user discovery, reproducibility proof, licensing review, signing and revocation design. | Secret inclusion, stale packages, redistribution restrictions. | Maintainers | Annual |
| Release Autopilot | Discovery | Readiness assessment, evidence collection, release plans, and rollback rehearsals with human promotion authority. | Release retrospectives, false-positive benchmark, human-control usability test. | Unsafe automation, automation bias, supply-chain authority creep. | Maintainers | Annual |
| Policy Simulator | Discovery | Explain and predict policy outcomes, proposed-bundle impact, and alternate-path bypasses. | Policy corpus, differential test harness, explanation quality rubric, bypass research. | Incorrect explanations, incomplete path coverage. | Maintainers | Annual |
| AI Evaluation Center | Signal | Deterministically compare skills, prompts, workflows, providers, safety, cost, latency, and reliability. | Evaluation taxonomy, fixture licensing, reproducibility study, data-use model. | Benchmark gaming, sensitive fixture content, provider drift. | Maintainers | Annual |
| Ecosystem Transparency Log | Signal | Track publisher identity, signatures, revocations, vulnerabilities, provenance, and compatibility. | Log threat model, append-only proof, privacy and governance analysis. | Publisher privacy, moderation burden, false reputation signals. | Maintainers | Annual |
| Developer Portal and IDE Bridge | Discovery | Deliver governed operations through VS Code, JetBrains, Cursor, Codex, and web surfaces without domain duplication. | CLI contract coverage, host capability matrix, accessibility prototype. | Host lock-in, inconsistent consent UX, duplicated logic. | Maintainers | Annual |
| Air-Gapped Enterprise Mode | Signal | Signed offline catalogs, mirrored packages, updates, policy distribution, and evidence export. | Air-gap deployment profiles, key lifecycle, mirror and expiry simulation. | Stale vulnerabilities, key compromise, licensing constraints. | Maintainers | Annual |
| FinOps and Sustainability Advisor | Signal | Forecast AI, CI, cloud, and local-compute cost and recommend policy-controlled optimization. | Cost-model accuracy, energy-data quality, explainability and privacy study. | Inaccurate forecasts, perverse optimization, vendor pricing drift. | Maintainers | Annual |
| Resilience Lab | Discovery | Automate crash, corruption, outage, rollback, disaster-recovery, and provider-failure exercises. | Fault catalog, safe sandbox design, recovery metrics, CI cost assessment. | Destructive tests escaping isolation, excessive resource use. | Maintainers | Annual |
| Maintainer Sustainability System | Signal | Track bus factor, ownership gaps, review load, release duty, support burden, and succession readiness. | Maintainer consent, privacy model, useful-action thresholds, anti-surveillance review. | Contributor surveillance, metric misuse, discouraging participation. | Maintainers | Annual |

## Ecosystem Extension Register

These opportunities extend the strategic `v2.1–v3.0` baseline. They remain discovery work unless a named release explicitly promotes them after evidence review.

| Opportunity | Stage | Required discovery evidence | Key risk |
| --- | --- | --- | --- |
| Registry migration and interoperability toolkit | Signal | Independent formats, round-trip fixtures, rollback proof. | Silent semantic loss. |
| Critical-package escrow and publisher succession | Signal | Legal model, key ceremony, abandonment and transfer exercises. | Unauthorized takeover. |
| Reproducible builds and independent rebuilds | Discovery | Deterministic toolchains, variance analysis, third-party prototype. | False reproducibility claims. |
| Pre-install dependency risk simulation | Discovery | Representative graphs, policy corpus, accuracy benchmark. | Missing risk or blocking safe changes. |
| Quarantine and last-known-good continuity | Discovery | Compromise drills, revocation latency, offline recovery. | Retaining vulnerable packages. |
| Cross-registry namespace defense | Discovery | Confusion, squatting, transfer, and mirror-conflict corpus. | Centralized authority. |
| Community moderation and legal process | Signal | Abuse taxonomy, appeals, copyright/trademark review, staffing. | Inconsistent moderation. |
| Vulnerability advisory federation | Signal | Schema interoperability, embargo workflow, propagation tests. | Premature disclosure. |
| Support lifecycle and end-of-life automation | Signal | Maintainer research, impact model, migration usability. | Surprise breakage. |
| Ecosystem disaster recovery | Discovery | Registry loss, key compromise, mirror outage, restore rehearsals. | Trust-state divergence. |
| Capability bundles and organization distributions | Signal | Composition, ownership, policy, and rollback tests. | Hidden transitive authority. |
| Privacy-preserving recommendations | Signal | Local baseline, minimization, consent, and deletion model. | Behavioral profiling. |
| Transparent sponsorship | Signal | Ranking separation, accessibility, audit, and disclosure. | Hidden paid influence. |
| Accessibility certification | Signal | WCAG protocol, independent review, expiry, and remediation. | Unsupported certification. |
| Regional mirrors and data residency | Signal | Jurisdiction mapping, routing, residency, and outage tests. | Cross-region leakage. |
| Public registry neutrality governance | Signal | Governance alternatives, transparency, and capture analysis. | Operator capture. |
| Air-gap promotion pipelines | Discovery | Zone transfer, signature, expiry, and rollback exercises. | Stale or tampered bundles. |
| Expiring enterprise certification | Discovery | Renewal, appeal, revocation, and limitation labels. | Score presented as security. |
| Automated conversion expansion | Signal | Representative external formats, deterministic converters, loss benchmarks, permission-delta tests, and maintenance ownership. | Silent semantic loss or unsafe authority expansion. |
| Version-scoped ecosystem reputation | Signal | Abuse model, verified-use privacy design, moderation capacity, appeals, and manipulation benchmarks. | Popularity misrepresented as trust or coordinated review abuse. |
| Governed collaborative forks | Signal | Lineage contract, license and trademark review, publisher identity, dependency behavior, and update isolation. | Ownership confusion, malicious impersonation, or license violations. |

## Product Health Model

Portfolio discovery should improve at least one product-health measure:

- adoption and successful activation;
- task completion and time to validated outcome;
- recovery, rollback, upgrade, and uninstall success;
- provider, plugin, template, platform, and package compatibility freshness;
- documentation task success and broken-reference rate;
- maintainer load, review latency, bus factor, and support burden;
- ecosystem signature, provenance, revocation, and vulnerability trust;
- cost, resource use, and operational sustainability.

No telemetry is collected by default. Research metrics use local, inspectable evidence or separately consented privacy-preserving measurement.

## Promotion Checklist

Before promotion to RFC, an opportunity must have a completed feature proposal, named owner, measurable value, alternatives, non-goals, security and privacy assessment, accessibility and sustainability impact, compatibility and lifecycle plan, estimated maintenance cost, evidence links, support hypothesis, and explicit exit criteria.

Architecture questions are tracked in the [Ecosystem ADR Candidate Register](ECOSYSTEM_ADR_CANDIDATES.md). A candidate is not an approved decision.

## Advanced Capability Opportunities

| Opportunity | Stage | Evidence required before RFC | Principal risk |
| --- | --- | --- | --- |
| Dynamic agent swarms | Signal | Isolation, deterministic replay, deadlock and livelock detection, budget enforcement, and useful-work benchmarks. | Runaway cost, unsafe delegation, irreproducible outcomes. |
| Self-evolving capabilities | Signal | Signed lineage, bounded optimization, rollback, evaluation stability, and human promotion research. | Supply-chain mutation and loss of accountable intent. |
| Cross-organization agent collaboration | Signal | Tenant isolation, federation trust, data residency, contracting, and dispute handling. | Confidentiality and authority leakage. |
| Autonomous capability optimization | Signal | Objective safety, adversarial evaluation, budget control, drift detection, and approval UX. | Reward hacking and unsupported improvement claims. |
| Paid marketplace transactions | Signal | Tax, payout, refund, fraud, entitlement, licensing, regional, and consumer-protection models. | Financial and regulatory exposure. |
| Robotics and embodied adapters | Signal | Namespaced-type prototype, simulator isolation, safety case, hardware consent, and emergency stop. | Physical harm and irreversible external effects. |
| Multi-modal capability packs | Signal | Data-class model, storage policy, accessibility, model compatibility, and redaction fixtures. | Sensitive media leakage and portability loss. |
| Capability composition optimizer | Signal | Resolver proof, authority analysis, conflict explanations, and deterministic lock generation. | Hidden transitive permissions. |
