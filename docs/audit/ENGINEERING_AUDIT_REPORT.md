# Engineering Audit Report: Phases 1–5

## Executive Summary

The platform has strong additive safety, explicit consent boundaries, broad automated coverage, no runtime package dependencies, and clear project-scoped registries. The architecture is suitable for the current single-process CLI scope. The largest maintainability risks are concentrated CLI/dashboard files, repeated JSON persistence patterns, weak corruption visibility, and inconsistent separation between read-only diagnostics and persisted operational evidence.

## Findings

| ID | Area | Severity | Finding |
| --- | --- | --- | --- |
| A-01 | Architecture | Medium | `src/cli.js` owns routing, prompting, consent orchestration, parsing, logging, and output formatting; continued growth will increase coupling and regression risk. |
| A-02 | Dashboard | Medium | Dashboard HTML, styling, state, and API client logic are embedded in one server-side string, limiting testability, accessibility review, and maintainability. |
| A-03 | Persistence | Medium | Registries independently implement read/merge/write behavior; schema validation, atomic writes, corruption handling, and migrations are inconsistent. |
| A-04 | Error handling | Medium | Several registry/config readers treat every read or JSON error as “missing,” which can hide corruption and silently reset state. |
| A-05 | Diagnostics | Medium | `doctor` writes logs even when otherwise used as a read operation; this weakens strict dry-run expectations. |
| A-06 | Configuration | Low | Platform configuration exposes only three generic settings while provider, cloud, and ecosystem settings use separate documents and conventions. |
| A-07 | Versioning | Medium | Platform version `0.2.0` and protocol/client versions are repeated in source and may drift from `package.json`. |
| A-08 | Providers | Medium | Retry behavior uses exponential delay but no jitter or `Retry-After` support; duplicated non-idempotent requests remain possible. |
| A-09 | Plugins | Medium | Semantic-version comparison ignores prerelease precedence and platform compatibility ranges are recorded but not enforced. |
| A-10 | Clouds | Medium | Non-Render blueprints are generic baselines and cannot guarantee stack-specific deployability without provider/account validation. |
| A-11 | MCP | Medium | Generated host configuration is intentionally partial for host contracts that cannot safely represent header references; adoption/removal remains manual. |
| A-12 | Templates | Low | Template assets are represented as large inline strings, making review and reuse harder as template complexity grows. |
| A-13 | Testing | Low | Test breadth is strong, but no coverage threshold, mutation testing, or performance regression budget is enforced. |
| A-14 | Cross-platform | Medium | CI defines Windows/Linux/macOS matrices, but OS credential-store adapters and real third-party CLIs are not exercised in automated account-backed tests. |
| A-15 | Developer experience | Low | JSON output is consistent, but long command families lack shell completion and machine-readable JSON Schema documentation. |

## Positive Controls

- Existing files are skip-only and managed rollback is ownership/hash based.
- External operations are preview-first and consent-gated.
- Secrets are excluded from registries, safe exports, logs by caller contract, package contents, and generated Git rules.
- MCP URLs/arguments reject inline credentials; remote endpoints require HTTPS except loopback.
- Remote plugins require trusted Ed25519 signatures and remain declarative/non-executable.
- The npm package has an explicit allowlist and cross-platform metadata.
- Seventy-five automated tests pass across bootstrap, providers, credentials, MCP, plugins, clouds, dashboard, logging redaction, health, registry, rollback, and release behavior.
