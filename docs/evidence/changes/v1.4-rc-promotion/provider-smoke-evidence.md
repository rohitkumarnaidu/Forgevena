# v1.4 RC Provider Smoke Evidence

**Recorded:** 2026-10-02  
**Change:** `v1.4-rc-promotion`  
**Decision impact:** Does not authorize stable certification, RC publication, PR merge, or release.

## Results

| Provider | Model/runtime | Result | Retained evidence |
| --- | --- | --- | --- |
| Gemini | `gemini-2.5-flash` | One minimal account-backed smoke passed. | Operation ID, date, token counts, and limitations in `provider-smoke-evidence.json`. |
| Ollama | `0.35.0`, `deepseek-r1:8b` (`sha256:6995872bfe4c521a67b32da386cd21d5c6e819b6e0d62f79f64ec83be99f5763`) | Discovery passed; two single-attempt inference checks timed out at 60 seconds. | Operation IDs, pinned digest, runtime version, and timeout in `provider-smoke-evidence.json`. |
| OpenAI | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |
| Anthropic/Claude | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |
| OpenRouter | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |

## Data Handling

Only normalized status, model identity, operation IDs, usage counts, runtime metadata, and limitations are retained. Credentials, prompts, responses, authorization headers, and raw provider payloads are not retained. The Gemini pass remains preview evidence; the Ollama timeout is a failed invocation check, not a pass.

See the [provider compatibility matrix](../../../providers/compatibility-matrix.md) and [v1.4 release checklist](../../../release/V1_4_RELEASE_CHECKLIST.md) for the current promotion gates.
