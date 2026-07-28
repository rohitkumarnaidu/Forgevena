# Example Standard Feature Scorecard

This retained schema v2 example demonstrates the canonical merge-readiness gate. It is training evidence only and does not approve a production change.

| Field | Value |
| --- | --- |
| Change | `example-standard-feature` |
| Profile | Standard code |
| Risk | Tier 1 |
| Checkpoint | Merge |
| Score | 100/100 |
| Quality band | Enterprise ready |
| Decision | Ready |

All 14 profile-specific domain gates pass. The governance documentation module is `important` and independently satisfies 95%; the fail-closed validation module is `critical` and independently satisfies 100%. Each module score is derived from evidence-backed criteria totaling 100 points. All mandatory blockers are clear, no waiver is active, and the matching machine-readable record is [`scorecard.json`](scorecard.json).

The evidence links intentionally reference repository-controlled documentation, schema, implementation, and test artifacts. Real assessments must replace these examples with evidence from the evaluated change and hosted CI.
