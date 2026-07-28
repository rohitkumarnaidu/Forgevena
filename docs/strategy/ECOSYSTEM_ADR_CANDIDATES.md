# Ecosystem Architecture Decision Candidates

> **Status:** Discovery register only. These are not approved decisions or implementation authorization.

| Candidate | Decision required | Required evidence before ADR |
| --- | --- | --- |
| EC-ADR-01 | Canonical package protocol and serialization | Independent implementation, hashing, migration, and fuzz results. |
| EC-ADR-02 | Trust roots and offline/Sigstore/TUF-compatible signing | Threat model, key recovery, revocation, and air-gap exercises. |
| EC-ADR-03 | Namespace ownership and cross-registry authority | Abuse analysis, transfer, succession, trademark, and confusion tests. |
| EC-ADR-04 | Federation, mirroring, and conflict resolution | Outage, split-brain, data-residency, and deterministic reconciliation evidence. |
| EC-ADR-05 | Moderation, appeals, and emergency action | Governance, legal, abuse, transparency, and response-time review. |
| EC-ADR-06 | Installation scopes and precedence | Resolver prototypes, policy-bypass tests, migration, and rollback. |
| EC-ADR-07 | Extension sandbox and lifecycle hooks | Escape tests, permission model, host APIs, and resource-bounding evidence. |
| EC-ADR-08 | OCI-compatible transport boundary | Interoperability, offline, signature, cost, and portability analysis. |
| EC-ADR-09 | Recommendation privacy and analytics consent | Data inventory, privacy model, local alternative, revocation, and deletion tests. |
| EC-ADR-10 | Search ranking, sponsorship, and transparency | User research, abuse model, accessibility, neutrality, and audit design. |
| EC-ADR-11 | Canonical capability families, namespaced types, and facets | Taxonomy fixtures, extension tests, migration mapping, and ambiguity analysis. |
| EC-ADR-12 | Host adapter normalization and translation loss reports | Round-trip fixtures, host research, permission preservation, and degraded-mode usability. |
| EC-ADR-13 | Deterministic orchestration graph, checkpoint, and replay semantics | Crash recovery, duplicate-effect tests, graph validation, and state migration evidence. |
| EC-ADR-14 | Agent-team authority, delegation, topology, and shared memory | Threat model, role fixtures, isolation tests, conflict handling, and budget enforcement. |
| EC-ADR-15 | Rule-set packaging and effective policy precedence | Bypass corpus, deny-overrides proof, explanation testing, and policy migration. |
| EC-ADR-16 | Schema-driven Capability Studio | Builder prototypes, accessibility research, schema reuse, security review, and maintenance analysis. |
| EC-ADR-17 | Evaluation and compatibility evidence contracts | Fixture provenance, expiry, reproducibility, appeals, and unsupported-claim controls. |
| EC-ADR-18 | Source-adapter acquisition and quarantine boundary | Source fixtures, consent, digest identity, malicious-input tests, offline bundles, and retention policy. |
| EC-ADR-19 | Semantic converter determinism and loss reporting | Round-trip corpus, permission-delta proof, manual-adaptation UX, sandbox threat model, and reproducibility benchmarks. |
| EC-ADR-20 | AgentSpace product boundary inside ForgeHub | User research, authority map, shared-domain API proof, accessibility prototype, and naming review. |
| EC-ADR-21 | Explainable recommendation evidence contract | Local metadata inventory, bias and abuse model, policy simulation, dismissal/deletion UX, and privacy review. |

Each candidate enters the Evidence Funnel at Discovery. Promotion requires an owner, feature proposal, alternatives, maintenance cost, compatibility impact, threat model, readiness scorecard, and explicit approval.
