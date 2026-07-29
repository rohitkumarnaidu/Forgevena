# Documentation Authority and Source-of-Truth Map

## Purpose

This map prevents duplicate authority. Supporting, generated, and historical documents must defer to the canonical source listed here.

| Concern | Canonical authority | Supporting surfaces |
|---|---|---|
| Permanent product invariants | `docs/strategy/PLATFORM_CONSTITUTION.md` | README, blueprint, guides |
| Engineering decisions and evidence | `docs/ENGINEERING_GOVERNANCE.md` | templates, scorecards, audit reports |
| Documentation lifecycle and quality | `docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md` | catalog, audit, coverage and debt reports |
| Product scope and architecture | `docs/strategy/FORGEVENA_PLATFORM_BLUEPRINT.md` | architecture overview and diagrams |
| Approved dependency order | `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md` | public roadmap summaries |
| Version implementation deltas | `docs/versions/version-specifications.json` plus the approved roadmap | generated version packages and planning bundles |
| Foundation subject discovery | `docs/foundation/foundation-map.yaml` | generated foundation facade pages |
| Uncommitted ideas | `docs/strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md` | RFC candidates and research radar |
| Capability taxonomy and lifecycle | `docs/architecture/ENTERPRISE_CAPABILITY_SYSTEM.md` | capability and package model |
| Package and federation protocol | `docs/architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md` | registry reference and ecosystem guides |
| Discovery and ecosystem experience | `docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md` | ForgeHub product experience |
| Source acquisition and conversion | `docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md` | publisher SDK strategy |
| Host portability | `docs/architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md` | compatibility reports |
| Agent and workflow execution | `docs/architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md` | workflow and capability references |
| Ecosystem trust and safety | `docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md` | security guide and threat models |
| Current CLI and source contracts | Source metadata plus generated references | human-authored CLI guides and examples |
| Completed releases | Signed tags, release assets, and release evidence | release notes and historical reports |
| Historical release classification | `docs/governance/release-retrospectives.json` | `docs/historical/` facade and release manifests |

## Directory Clarifications

- `docs/adr/` contains retained architecture-decision records; `docs/adrs/index.md` is the active navigation index.
- `docs/release/` contains current release engineering guidance; `docs/releases/` indexes published release history.
- `docs/audit/`, `docs/rc/`, `docs/v1/`, and phase or release-specific root documents are historical evidence unless explicitly cataloged otherwise.
- `docs/reference/generated/` is generator-owned and must not be edited manually.
- `docs/versions/` Markdown and per-version YAML files are generator-owned deltas; edit `docs/versions/version-specifications.json` through the governed roadmap-change process.
- `docs/foundation/` is a generated discovery facade, not a duplicate architecture hierarchy.
- `docs/historical/` indexes immutable evidence and never modernizes historical claims.

The generated document catalog is the authoritative machine-readable classification. This map remains the human-readable policy view.
