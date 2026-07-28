# Schema Reference

Canonical JSON Schemas are stored in [`docs/reference/schemas`](../reference/schemas/):

- workspace registry;
- managed assets manifest;
- provider profile;
- declarative plugin manifest;
- MCP server definition.
- enterprise change-readiness scorecard.
- documentation catalog and lifecycle metadata.
- documentation impact analysis and synchronization evidence.
- visual freshness, accessibility, and source-dependency evidence.
- allowlisted executable-example evidence.

The [change-readiness scorecard schema](../reference/schemas/change-readiness-scorecard.schema.json) defines the retained machine-readable evidence used by push, merge, and release gates. The canonical scoring rules and applicability profiles are documented in the [Enterprise Change Readiness Scorecard](../governance/CHANGE_READINESS_SCORECARD.md).

The [documentation catalog schema](../reference/schemas/document-catalog.schema.json) defines classification, authority, ownership, lifecycle, freshness, related evidence, and security/privacy/accessibility relevance for the complete documentation corpus.

The [documentation impact schema](../reference/schemas/documentation-impact.schema.json) defines deterministic change classification, affected components, implementation/test/documentation coupling, mandatory blockers, and the push or merge decision used by documentation CI.

The [documentation evidence bundle schema](../reference/schemas/documentation-evidence-bundle.schema.json) defines checksummed pull-request and release synchronization reports. The [visual evidence schema](../reference/schemas/visual-evidence.schema.json) and [executable example schema](../reference/schemas/executable-example-evidence.schema.json) prevent stale images, inaccessible visual claims, unsafe command execution, and unverifiable examples.

Schema v2 enforces profile-specific domain targets and separate module-criticality targets: standard modules require 90%, important modules 95%, and critical modules 100% at merge and release. An overall score cannot compensate for a failed domain or module.

Capability governance adds dedicated profiles for capability packages, host adapters, agent teams, orchestration, rules and guardrails, knowledge and memory, Capability Studio and publishers, and marketplace or registry distribution. These profiles are readiness contracts only; they do not authorize runtime schemas.

Schemas document public persisted contracts. Runtime validation remains authoritative, and schema changes require migration, compatibility review, and release notes.
