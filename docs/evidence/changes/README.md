# Change Readiness Evidence

Significant changes retain auditable readiness evidence at:

```text
docs/evidence/changes/<change-id>/
├── scorecard.md
└── scorecard.json
```

The Markdown record explains engineering judgment. The JSON record follows [`change-readiness-scorecard.schema.json`](../../reference/schemas/change-readiness-scorecard.schema.json) and is validated by the governance test suite.

Tier 2, Tier 3, release, migration, trust-boundary, and breaking changes retain the complete documentation synchronization bundle. Generate it with `npm run docs:impact -- --base <base-sha> --head <head-sha> --checkpoint merge --change-id <change-id> --owner <owner> --output-dir docs/evidence/changes/<change-id>/documentation --check`. The contracts are defined by [`documentation-impact.schema.json`](../../reference/schemas/documentation-impact.schema.json) and [`documentation-evidence-bundle.schema.json`](../../reference/schemas/documentation-evidence-bundle.schema.json).

Use stable lowercase change IDs such as `issue-142-provider-timeouts`, `rfc-018-forgeregistry-protocol`, or `release-v1.4.0`. Never include secrets, prompts, responses, credentials, local workspace state, private incident data, or user content in retained evidence.

Update the same record as work moves from `push` to `merge` to `release`, or retain checkpoint-specific revisions when audit policy requires immutable evidence. Published release evidence is immutable.
