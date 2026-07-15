# Engineering Governance

## Quality Gate

A significant feature, module, or integration is complete only when:

1. Requirements are documented.
2. Architecture impact is assessed and existing components are reused.
3. Implementation and automated unit/integration tests pass.
4. Documentation, registry/schema notes, and CLI help are updated.
5. Security, performance, and backward-compatibility implications are assessed.

## Architecture Rule

The platform architecture is frozen. A new core abstraction requires a demonstrated problem, a trade-off analysis, a compatibility plan, and an approved ADR before implementation.
