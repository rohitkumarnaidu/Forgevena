# Governance

Forgevena uses maintainer-led, evidence-driven governance.

## Roles

- **Contributors** propose focused changes and participate in review.
- **Reviewers** assess correctness, tests, documentation, security, and compatibility.
- **Maintainers** merge changes, manage releases, security response, roadmap, and repository settings.
- **Release maintainers** approve signed tags, package publication, and release assets.

Current maintainers are listed in [MAINTAINERS.md](MAINTAINERS.md), and path ownership is encoded in [.github/CODEOWNERS](.github/CODEOWNERS).

## Decision process

Routine changes require review and green quality gates. Significant architecture, security-boundary, persistence, or compatibility decisions require an ADR. The 1.x architecture is frozen: new platform layers are rejected unless they solve a demonstrated problem and reduce long-term complexity.

## Releases

Releases require passing CI, security, documentation, package, upgrade, rollback, and checksum gates. Publication credentials and protected environments require maintainer approval.

## Conduct and disputes

All participation follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Maintainers resolve technical disputes using documented requirements, evidence, compatibility, and security impact rather than authority alone.
