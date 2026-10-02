# v1.4 RC Provider Smoke Evidence

**Recorded:** 2026-10-02  
**Change:** `v1.4-rc-promotion`  
**Decision impact:** Does not authorize stable certification, RC publication, PR merge, or release.

## Results

| Provider | Model/runtime | Result | Retained evidence |
| --- | --- | --- | --- |
| Gemini | `gemini-2.5-flash` | One minimal account-backed smoke passed. | Operation ID, date, token counts, and limitations in `provider-smoke-evidence.json`. |
| Ollama local | `0.35.0`, `deepseek-r1:8b` (`sha256:6995872bfe4c521a67b32da386cd21d5c6e819b6e0d62f79f64ec83be99f5763`) and `gemma4:12b` (`sha256:4eb23ef187e2c5462566d6a1d3bbbc2f1346d0b4327cbb66d58fffbcc9b2b05c`) | Discovery passed; both models timed out across three bounded inference attempts at 60 seconds each. | Operation IDs, pinned digests, runtime version, and timeouts in `provider-smoke-evidence.json`. |
| Ollama Cloud | `0.35.0`, requested `gemma4:cloud`; response identified `gemma4` | One fixed synthetic health request passed in one attempt; account-backed cloud invocation, not local inference evidence. | Command/invocation operation IDs and token counts in `provider-smoke-evidence.json`; no prompt or response retained. |
| OpenAI | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |
| Anthropic/Claude | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |
| OpenRouter | Not configured | Not run; an owner-controlled restricted key is required. | No evidence. |

## Data Handling

Only normalized status, requested/reported model identifiers, operation IDs, usage counts, runtime metadata, and limitations are retained. Credentials, prompts, response content, authorization headers, and raw provider payloads are not retained in the evidence files. The Gemini and Ollama Cloud passes remain preview evidence; the local Ollama timeout is a failed local invocation check, not a pass.

See the [provider compatibility matrix](../../../providers/compatibility-matrix.md) and [v1.4 release checklist](../../../release/V1_4_RELEASE_CHECKLIST.md) for the current promotion gates.
