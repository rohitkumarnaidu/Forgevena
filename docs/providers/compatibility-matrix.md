---
documentId: FORGEVENA-PROVIDER-COMPATIBILITY-MATRIX
title: Provider Compatibility Matrix
type: reference
status: maintained
owner: Provider Platform Working Group
lastVerified: 2026-08-01
reviewBy: 2026-10-30
versions:
  - v1.4.0
---

## Compatibility Evidence

This matrix distinguishes deterministic offline contract evidence from live account and model verification. Offline fixtures verify protocol normalization, streaming, usage, error handling, and redaction without transmitting project data.

| Public provider ID | Service | Offline contract evidence | Live account evidence | Current claim |
| --- | --- | --- | --- | --- |
| `openai` | OpenAI | Verified | Not executed | Preview |
| `claude` | Anthropic | Verified | Not executed | Preview |
| `gemini` | Google Gemini | Verified | Not executed | Preview |
| `openrouter` | OpenRouter | Verified | Not executed | Preview |
| `ollama` | Ollama | Verified | Not executed | Preview |

The public `claude` identifier remains stable throughout 1.x while metadata identifies Anthropic as the service. Codex, Cursor, and Windsurf remain compatibility-only agent-host integrations and are not included in the five-provider certification claim.

## Evidence

- Manifest: `providers/compatibility-evidence.json`
- Sanitized fixtures: `providers/fixtures/`
- Verification command: `npm run providers:verify`
- Contract tests: `test/provider-compatibility.test.js` and `test/provider-streaming.test.js`

## Promotion Gate

Stable provider support requires credential-gated, consent-gated live smoke tests against approved provider accounts and dated model versions. Live tests must not persist prompts, responses, credentials, authorization headers, or raw provider payloads. Expired compatibility evidence becomes `stale`; policy may fail closed when current evidence is mandatory.

## Known Limits

- Offline fixtures do not prove current provider availability, billing status, quotas, regional access, or model lifecycle status.
- OpenRouter compatibility also depends on the selected upstream model.
- Ollama compatibility depends on the installed runtime and pinned local model.
- No release may represent this offline matrix as live certification.
