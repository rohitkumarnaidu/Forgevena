# Improvement Backlog and Priority Matrix

## Priority Matrix

| Priority | Initiative | Value | Effort | Dependency |
| --- | --- | --- | --- | --- |
| P0 | None | No release-blocking software defect was found by the current automated gates. | — | — |
| P1 | Transactional credential lifecycle and stronger KDF | High | Medium | Security ADR and migration plan |
| P1 | Central logging redaction | High | Medium | Logging schema and compatibility tests |
| P1 | Safe import content scanning/schema allowlist | High | Medium | Export schema versioning |
| P1 | Atomic schema-validated registry store | High | High | Registry migration ADR |
| P2 | CLI command-handler decomposition | High | High | Preserve command/output compatibility |
| P2 | Dashboard asset/API decomposition | Medium | Medium | Browser test harness |
| P2 | Provider retry/idempotency refinement | Medium | Medium | Provider-specific contract review |
| P2 | Cloud artifact schema validators | Medium | Medium | Provider specification/version tracking |
| P2 | Health required/optional semantics | Medium | Low | Registry schema update |
| P3 | Template resource extraction | Medium | Medium | Package resource loading tests |
| P3 | Shell completion and JSON Schemas | Medium | Medium | Stable CLI/schema surface |
| P3 | Coverage, mutation, and benchmark gates | Medium | Medium | CI runtime budget |

## Recommended Sequence

1. Approve security ADRs for credential transactions/KDF, redaction, and safe import.
2. Introduce an atomic registry persistence contract with migration tests.
3. Refactor CLI command handlers without changing output contracts.
4. Extract dashboard assets and add browser accessibility/E2E coverage.
5. Refine provider retries and health semantics.
6. Add provider-versioned cloud validators.
7. Extract templates and add developer-experience tooling.

Implementation must not begin until this audit and its ADR requirements are approved.
