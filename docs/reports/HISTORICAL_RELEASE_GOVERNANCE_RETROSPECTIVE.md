# Historical Release Governance Retrospective

> **Assessment date:** 2026-07-28T18:30:00.000Z
>
> **Policy effective from:** v1.3.1
>
> This report evaluates retained evidence without rewriting history. A historical score is not a claim that a release passed rules that did not yet exist.

## Decision Semantics

- **current-certified:** Released after the policy effective version with complete retained current-rule evidence.
- **historical-assurance:** Published successfully with meaningful historical evidence, but not certified under the later governance contract.
- **failed-as-recorded:** The immutable tag or publication attempt failed and is retained as evidence.
- **not-certified:** Available evidence is insufficient for either current certification or historical assurance.

## Release Matrix

| Release | Outcome | Retrospective score | Decision | Assessment |
| --- | --- | ---: | --- | --- |
| `v1.2.0` | failed-publication | 0% | failed-as-recorded | The source version matched, but the tag was unsigned, the release workflow failed, and no npm package or GitHub Release was published. |
| `v1.2.1` | published | 72% | historical-assurance | The signed patch release was repaired and published through npm and GitHub Releases, but it predates retained current-rule scorecards. |
| `v1.2.2` | failed-publication | 43% | failed-as-recorded | The signed immutable tag failed native-runtime verification and correctly published neither npm nor a GitHub Release. |
| `v1.2.3` | published | 87% | historical-assurance | The signed corrective release passed automated native package checks and published through npm and GitHub Releases. |
| `v1.3.0` | published | 100% | historical-assurance | The signed reliability release has complete contemporary implementation, migration, security, performance, documentation, and publication evidence, but predates the new canonical scorecard policy. |

## Findings and Improvement Input

- **v1.2.0:** Require signed tags before publication.
- **v1.2.0:** Retain release-checkpoint evidence before triggering external channels.
- **v1.2.1:** Retain one immutable release run instead of relying on repair workflow history.
- **v1.2.1:** Retain machine-readable post-release channel verification.
- **v1.2.2:** Standalone smoke testing must precede tag creation.
- **v1.2.2:** A failed immutable tag must be followed by a new patch version, never moved or reused.
- **v1.2.3:** Retain one machine-readable post-release channel matrix with package-manager moderation outcomes.
- **v1.3.0:** Future releases must retain the canonical release scorecard and documentation evidence bundle before tagging.

## Binding Rule

Releases before v1.3.1 are never silently upgraded to current-certified. Releases at or after v1.3.1 must retain a release-checkpoint scorecard, documentation evidence bundle, channel verification, migration and rollback evidence, and post-release review before they may be marked current-certified.
