# Research and Standards Radar

> **Status:** Maintained research register. Inclusion does not imply compliance, certification, roadmap commitment, or runtime adoption.

## Purpose

The radar tracks external frameworks and emerging practices that may improve Forgevena. Every adoption proposal enters the Evidence Funnel and records applicability, alternatives, cost, legal constraints, maintenance burden, evidence freshness, and an exit strategy.

## Adopt for Practical Guidance

| Framework | Use | Boundary | Review cadence |
|---|---|---|---|
| Diátaxis | Separate tutorials, how-to guides, reference, and explanation | Documentation architecture only | Annual |
| arc42 | Architecture concern coverage | Tailored mapping; no template lock-in | Annual |
| ISO/IEC 25010:2023 | Product-quality vocabulary and acceptance dimensions | No certification claim | Annual |
| NIST SSDF | Secure-development evidence and release practices | Outcome mapping, not compliance assertion | Semiannual |
| NIST AI RMF and Generative AI Profile | AI risk identification, measurement, governance, and management | Applies to AI-enabled capabilities; no regulatory claim | Semiannual |
| OpenSSF OSPS Baseline | Open-source security control floor | Point-in-time self-assessment only | Quarterly |
| SLSA | Build provenance and supply-chain integrity | Claims require reproducible release evidence | Each release |

## Certification-Ready, Not Certified

Forgevena may prepare evidence mappings for formal assurance programs, but certification requires approved scope, budget, legal review, independent assessment, evidence retention, control ownership, and remediation governance. Marketing and documentation must distinguish `mapped`, `self-assessed`, `independently assessed`, and `certified`.

## Research Candidates

| Candidate | Problem | Required evidence before adoption |
|---|---|---|
| Documentation evidence graph | Trace requirements, decisions, contracts, tests, releases, and docs | Prototype, data model, maintenance-cost study, privacy review |
| Executable documentation | Detect stale commands and examples | Sandboxed fixture runner, deterministic outputs, platform matrix |
| Documentation digital twin | Model authorities, versions, dependencies, owners, and freshness | Catalog stability, query use cases, false-positive analysis |
| AI context packs | Give coding agents bounded authoritative context | Injection threat model, token budget, authority tests, opt-in export |
| Semantic documentation search | Improve discovery across large corpora | Local-first index, privacy limits, benchmark, deletion and retention |
| Documentation observability | Measure findability and task success | No telemetry by default; local metrics and explicit consent model |
| Policy-as-code crosswalks | Automate evidence collection against external controls | Versioned mappings, expiry, limitations, human review |
| Localization framework | Support international contributors and users | Source-language authority, translation lifecycle, accessibility review |

## Rejected Defaults

- Mandatory telemetry or behavioral analytics.
- Automatic certification claims.
- AI-generated documentation published without accountable review.
- External standards that silently override the Constitution or roadmap.
- Vendor-specific formats becoming canonical platform contracts.

## Promotion Rule

A radar item becomes planned work only after Discovery, an owner, measurable value, alternatives, RFC, architecture and security review, maintenance analysis, roadmap impact, and a passing change-readiness scorecard.
