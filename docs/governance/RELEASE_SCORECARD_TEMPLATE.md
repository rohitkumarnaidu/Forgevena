# Release Scorecard Template

This is a release-specific extension of the canonical [Enterprise Change Readiness Scorecard](CHANGE_READINESS_SCORECARD.md). Complete and retain the canonical Markdown and JSON records first; this template adds distribution-channel, roadmap, and post-publication evidence without redefining readiness scoring.

## Release Metadata

| Field | Value |
| --- | --- |
| Version and channel | vX.Y.Z / rc or stable |
| Commit and signed tag | Immutable references |
| Release owner | Named maintainer |
| Decision | promote, hold, or reject |
| Canonical scorecard | `docs/evidence/changes/<change-id>/scorecard.md` |
| Machine-readable scorecard | `docs/evidence/changes/<change-id>/scorecard.json` |
| Risk, checkpoint, and score | Tier 1–3 / release / N of 100 |

## Canonical Gate

- [ ] The canonical scorecard decision is `ready` at the `release` checkpoint.
- [ ] The release meets its risk-tier threshold and active-domain minimum.
- [ ] Mandatory blockers are clear and waivers are approved and unexpired.
- [ ] Release approvers and evidence links are recorded.

## Evidence

| Domain | Result | Evidence link | Waiver |
| --- | --- | --- | --- |
| Architecture | pass, fail, or not applicable | Report or ADR | Waiver ID or none |
| Security and privacy |  |  |  |
| Accessibility |  |  |  |
| Reliability and rollback |  |  |  |
| Performance |  |  |  |
| Testing and compatibility |  |  |  |
| Documentation and developer experience |  |  |  |
| Supply chain and packages |  |  |  |
| Open-source and enterprise readiness |  |  |  |
| Technical debt and gaps |  |  |  |

## Channel Verification

Record clean installation, upgrade, rollback, uninstall, version reporting, and health verification for npm, GitHub Release, containers, documentation, Homebrew, Winget, Chocolatey, and any supported candidate channel.

## Roadmap Reconciliation

List completed, deferred, rejected, discovered, deprecated, and retired work. Include known limitations, outstanding external approvals, approved waivers, and post-release review date.
