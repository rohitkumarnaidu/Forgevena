# Forgevena v1.4.0 Implementation Status

## Decision

The v1.4.0 provider-platform implementation is merged, and signed `v1.4.0-rc.3` is published as a GitHub prerelease. PR [#55](https://github.com/rohitkumarnaidu/Forgevena/pull/55) merged to `main` as `26755e5a62ead4caa4084818defe7d4b21346271` on 2026-10-03. The RC3 release includes the npm archive, Windows/Linux/macOS executables, package-manager bundles, checksums, SBOM, provenance, documentation evidence, and release-verification reports. RC1, RC2, and RC3 are immutable; RC2 did not publish because its documentation gate failed.

**Stable promotion is HOLD.** Required owner-account provider evidence and the exact-RC3 lifecycle matrix are incomplete. Gemini has one sanitized preview smoke result. Local Ollama inference timed out for the tested models; OpenAI, Anthropic/Claude, and OpenRouter have no retained owner-account smoke evidence. The deterministic offline compatibility manifest is not live evidence. Stable tagging and publication must wait for the gates in [the v1.4 release checklist](V1_4_RELEASE_CHECKLIST.md).

## Implemented

| Area | Result | Evidence |
| --- | --- | --- |
| Provider domain | Shared `ProviderService`, `ProviderRegistry`, `ProviderAdapter v1`, and invocation coordination | `src/provider-service.js`, `src/provider-registry.js`, `src/provider-adapter.js`, `src/invocation-coordinator.js` |
| Provider adapters | OpenAI, Anthropic through the public `claude` ID, Gemini, OpenRouter, and Ollama adapters implemented; stable certification remains pending | `src/provider-runtime.js`, `providers/compatibility-evidence.json` |
| Compatibility hosts | Codex, Cursor, and Windsurf remain compatibility-only agent-host integrations | `src/providers.js`, provider documentation |
| Invocation safety | One deadline, cancellation, bounded retries, `Retry-After`, full jitter, idempotency, budgets, and explicit fallback | `src/invocation-coordinator.js`, provider resilience tests |
| Streaming | Ordered normalized events and malformed-stream rejection | Provider stream fixtures and contract tests |
| Registry migration | Preview, backup, transform, validation, atomic commit, and rollback | `src/provider-registry.js`, migration tests |
| Privacy | Restricted content and credentials are excluded from logs, errors, diagnostics, registries, and evidence | Privacy review and adversarial redaction tests |
| Interfaces | Existing provider CLI and dashboard use shared domain services with structured envelopes | CLI and dashboard tests |
| Governance | RFC, ADR, threat model, privacy review, traceability, Tier-3 scorecard, and retained merge evidence | `docs/evidence/changes/v1.4.0-provider-platform/` |

## Verified RC3 State

| Gate | Result |
| --- | --- |
| Merge | PR #55 merged to `main`; no admin bypass was used for this promotion work |
| Release | Signed `v1.4.0-rc.3` is a prerelease, not stable |
| Release assets | npm archive, platform executables, distribution bundles, checksums, SBOM, provenance, documentation evidence, and release-verification report are attached |
| Provider evidence | Gemini smoke passed once; local Ollama invocations timed out; three hosted providers remain untested in retained evidence |
| Stable channels | No stable `1.4.0` promotion or package-manager submission is recorded by this checklist |

The RC3 release is [available on GitHub](https://github.com/rohitkumarnaidu/Forgevena/releases/tag/v1.4.0-rc.3). The [RC1 local smoke report](../evidence/releases/v1.4.0-rc.1/LOCAL_SMOKE_VALIDATION.md) is immutable historical evidence and does not certify RC3. Current sanitized provider observations are in [v1.4 RC promotion evidence](../evidence/changes/v1.4-rc-promotion/provider-smoke-evidence.md). The machine-readable stable gate starts at [stable-release-readiness.json](../evidence/releases/v1.4.0/stable-release-readiness.json).

## Remaining Gates

1. Owner-controlled, explicitly consented smoke tests for OpenAI, Anthropic/Claude, Gemini, and OpenRouter; successful local Ollama inference using an installed, digest-pinned model.
2. Exact published RC3 lifecycle testing on Windows, Linux, and macOS with Node.js 20 and 22: clean install, upgrade from 1.3.0, migration, rollback, offline install, cancellation, uninstall, and workspace preservation.
3. A release-readiness scorecard with critical controls at 100%, important controls at least 95%, standard controls at least 90%, and no blockers.
4. Protected stable-release approval, signed stable `v1.4.0` promotion, final documentation deployment, and post-release verification.
5. Verified `1.4.0` outcomes in Homebrew, Winget, and Chocolatey. Chocolatey `1.2.3` was rejected for inactivity and remains closed historical evidence.

No stable tag or publication is authorized by this status document. Live provider requests require owner-controlled credentials and explicit consent. Never paste or commit credentials, and never use leaked keys.
