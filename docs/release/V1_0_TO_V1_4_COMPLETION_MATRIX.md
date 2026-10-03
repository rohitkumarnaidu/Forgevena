# Forgevena v1.0–v1.4 Completion Matrix

> **Verified:** 2026-08-02  
> **Rule:** Historical outcomes are immutable. Current governance is applied prospectively and never upgrades an older release's assurance claim.

| Version or milestone | Immutable release status | Implementation status | Evidence decision |
| --- | --- | --- | --- |
| `v1.0.0` | No repository tag | Historical product milestone recorded in changelog and release notes | Do not represent as a published or currently certified release |
| `v1.1.0` | No repository tag | Historical architecture and capability milestone | Do not fabricate a tag, package, or retrospective certification |
| `v1.2.0` | Immutable failed publication tag | Release preparation completed; publication failed | Preserve failure record; superseded by `v1.2.1` |
| `v1.2.1` | Published historical assurance | Cross-platform release and documentation repairs shipped | Complete under its release-era controls |
| `v1.2.2` | Immutable failed publication tag | Distribution hardening was attempted; publication failed | Preserve failure record; superseded by `v1.2.3` |
| `v1.2.3` | Published historical assurance | Native packages and standalone distribution shipped | Complete under its release-era controls |
| `v1.3.0` | Published historical assurance | E1 reliability and security foundation shipped | Complete; immutable evidence reconciled |
| `v1.4.0` | Signed `v1.4.0-rc.3` prerelease published; no stable tag | Provider platform and credential-slot work merged through PR #55 | **Stable Release HOLD** pending live-provider evidence, exact-RC3 lifecycle rehearsal, release scorecard, approval, and stable channel verification |

## Canonical Evidence

- Historical tags and outcomes: [Historical Release Governance Retrospective](../reports/HISTORICAL_RELEASE_GOVERNANCE_RETROSPECTIVE.md)
- Published v1.3 status: [v1.3 Implementation Status](V1_3_IMPLEMENTATION_STATUS.md)
- Current provider implementation: [v1.4 Implementation Status](V1_4_IMPLEMENTATION_STATUS.md)
- Promotion controls: [v1.4 Release Checklist](V1_4_RELEASE_CHECKLIST.md)
- Machine-readable stable release gate: [v1.4.0 readiness record](../evidence/releases/v1.4.0/stable-release-readiness.json)
- Version roadmap: [Versioned Product Roadmap](../strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md)

## Completion Rule

“Implementation complete” means all repository-controlled behavior, tests, schemas, documentation, and local evidence are complete. “Release complete” additionally requires hosted cross-platform checks, required external-account evidence, an approved release candidate, signed immutable publication, and post-release verification. These states must never be conflated.
