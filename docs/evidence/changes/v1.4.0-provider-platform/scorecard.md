# v1.4.0 Provider Platform Push Readiness

**Decision: READY for branch push.** This Tier-3 decision authorizes review and hosted validation only. It does not authorize an RC, stable tag, live provider certification, or publication.

| Control class | Required | Result |
| --- | ---: | ---: |
| Critical modules | 100% | 100% |
| Important modules | 95% | 100% |
| Standard modules | 90% | 100% |
| Overall push gate | 90% | 100% |

## Evidence

- Versioned provider, registry, compatibility, and state schemas.
- RFC, ADR, threat model, privacy review, compatibility matrix, and operations runbook.
- Checksummed sanitized fixtures for OpenAI, Anthropic/Claude, Gemini, OpenRouter, and Ollama.
- Provider contract, streaming, migration, resilience, redaction, performance, CLI, and dashboard tests.
- Full local tests and coverage passed.
- The npm archive clean-install smoke passed with `version` and read-only `doctor`.
- The Windows standalone executable passed `version` and `doctor` smoke tests.
- The Node 22 non-root container passed `version`, `doctor`, help, and mounted-workspace dry-run checks.

## Limitations

- Live provider account and model verification has not run and is not claimed.
- Compatibility evidence remains `preview` until credential- and consent-gated live smoke tests pass.
- Codex, Cursor, and Windsurf remain compatibility-only agent hosts.
- Hosted CI, RC installation, distribution, and publication are release-checkpoint evidence.
