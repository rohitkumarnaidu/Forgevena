# v1.4.0 Provider Platform Change Evidence

> **Change:** `v1.4.0-provider-platform`  
> **Risk:** Tier 3  
> **Checkpoint:** Push readiness is evaluated locally; merge and release evidence remain pending until hosted validation.

## Authorities

- [Normative implementation contract](../../../versions/v1.4.0/implementation-contract.md)
- [Implementation readiness audit](../version-readiness-audit-v1.4.0/audit.md)
- [Provider platform RFC](rfc.md)
- [Threat model](threat-model.md)
- [Privacy review](privacy-review.md)
- [Architecture decision](adr.md)
- [Push readiness scorecard](scorecard.md)
- [Machine-readable scorecard](scorecard.json)

## Traceability

| Feature | Runtime | Contracts | Tests | Documentation | Evidence |
| --- | --- | --- | --- | --- | --- |
| `provider-adapter-contract` | Provider adapter and service modules | Provider contract and profile schemas | Shared adapter, fixture, CLI, and migration suites | Provider reference and CLI guide | Pending implementation results |
| `provider-resilience-compatibility` | Invocation coordinator and registry | Compatibility and registry schemas | Retry, cancellation, fallback, budget, freshness, and recovery suites | Operations and compatibility guides | Pending implementation results |

No future result is claimed by this directory. Local push evidence is retained only after the corresponding command passes; hosted, live-account, RC, and release results remain pending.
