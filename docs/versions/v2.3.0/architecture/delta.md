# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Defines only the architecture delta from the canonical Forgevena platform blueprint.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Architecture Delta

Add ForgeHub as the discovery and lifecycle experience over ForgeRegistry and Forgevena Core; AgentSpace remains a ForgeHub area.

```mermaid
flowchart LR
  U["User or governed automation"] --> P["Preview and policy"]
  P --> C["ForgeHub Discovery and Lifecycle"]
  C --> S["State, evidence, and rollback"]
  S --> V["Validation and health"]
```

## Component and Module Boundaries

Committed features remain behind existing application-context, state, policy, consent, audit, and rollback services. No feature may introduce a parallel authority.

## Data and Control Flow

Inputs are schema-validated, classified, and policy-evaluated. External effects stop at consent boundaries. Outputs contain metadata and evidence references, while secrets and sensitive content remain excluded.

## Dependencies

- v2.2.0

## Failure Modes

- Partial operations recover from journals or last-known-good state.
- Unsupported compatibility fails visibly.
- Missing credentials, approval, billing, or network access stops at preflight.
- Corrupt or unverifiable evidence blocks promotion.
