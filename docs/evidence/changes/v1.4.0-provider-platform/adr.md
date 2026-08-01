# ADR — Governed Provider Boundary

## Status

Approved for v1.4.0 implementation by the existing roadmap and readiness audit.

## Decision

Provider protocol translation remains in adapters; selection and policy remain in the service; state and compatibility remain in the registry; deadlines, cancellation, retries, fallback, budgets, and usage remain in the coordinator. Credentials remain owned by the vault.

## Consequences

Legacy exports become compatibility wrappers. New provider behavior must pass the shared contract suite. Direct adapter state writes, raw credential access outside approved resolution, hidden fallback, and unsupported stable claims are prohibited.
