# RFC — Production Provider Platform

## Decision

Evolve the existing provider modules behind `ProviderService`, `ProviderAdapter`, `ProviderRegistry`, and `InvocationCoordinator`. These are responsibilities inside the approved application architecture, not a new platform layer.

## Compatibility

Existing commands, state paths, credential references, prompt input, and the public `claude` identifier remain valid. Agent hosts remain compatibility-only and are excluded from the five-provider stable certification claim.

## Failure Policy

Unknown capabilities, stale required evidence, unsafe retries, hidden fallback, missing consent, missing credentials, and exhausted budgets fail closed with stable errors. Migration is preview-first and restores the prior registry snapshot after partial failure.
