# Technical Debt Report

## High-Value Debt

1. Centralize redacted, atomic, schema-validated JSON persistence.
2. Make credential rotation transactional and strengthen passphrase derivation.
3. Split CLI command families into isolated handlers with typed option parsing.
4. Separate dashboard assets and API handlers from the HTTP server.
5. Load platform version and protocol metadata from one authoritative source.

## Medium Debt

- Enforce plugin platform compatibility and standards-compliant semantic versions.
- Add provider retry jitter, `Retry-After`, and idempotency guidance.
- Distinguish optional, configured, degraded, and required health states.
- Add format/schema validators for each generated cloud artifact.
- Introduce explicit corrupt-state errors and recovery documentation.
- Replace inline template strings with versioned template resources.

## Low Debt

- Generate shell completion.
- Publish JSON Schemas for registries and safe exports.
- Add performance benchmarks for large registries and project scans.
- Add coverage and mutation-testing gates.
- Improve dashboard accessibility and browser end-to-end testing.

## Debt Boundaries

Manual third-party installation, live account verification, billing approval, and executable plugin sandboxing are external/governed scope rather than technical debt in the current implementation.
