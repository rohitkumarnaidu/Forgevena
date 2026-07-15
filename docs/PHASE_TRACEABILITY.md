# Phases 1–4 Traceability

| Phase | Requirement | Evidence | Completion condition |
| --- | --- | --- | --- |
| 1 | Specifications and governance | `docs/specification/`, ADRs, governance guide | Documents match executable behavior. |
| 2 | CLI foundation and safe lifecycle | CLI, project, module, doctor, config, logging tests | Every documented command has tested behavior. |
| 3 | Tool integrations and provider preparation | Integration/provider registry, consent plans, health tests | No tool or secret is handled outside the declared lifecycle. |
| 4 | Bootstrap engine and templates | Template catalog, managed manifest, validation, E2E tests | All supported templates create validated, additive projects. |

## Acceptance Evidence

Every completion claim requires passing automated tests, updated CLI help, updated user documentation, security and compatibility review, and a registry/schema note when persisted data changes.
