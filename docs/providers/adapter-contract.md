# Provider Adapter Contract

Forgevena provider adapters expose a versioned capability boundary over model APIs, local runtimes, and authenticated agent hosts.

Every adapter publishes its provider name, kind, credential reference, default model, declared capabilities, and known limitations. Operations fail closed when a capability is not declared.

ProviderAdapter v1 operations are:

- `metadata()` for compatibility discovery.
- `supports()` and `require()` for capability enforcement.
- `health()` for provider-specific readiness.
- `invoke()` for normalized generation or agent execution.
- `validateConfiguration()` for fail-closed profile and capability checks.
- `discoverModels()` and the 1.x `models()` wrapper for providers declaring discovery.
- `stream()` for ordered, normalized events.
- `cancel()` for operation-scoped cancellation.
- `auth()` for hosts declaring authentication status.

Streaming events use `start`, `content-delta`, `tool-call`, `usage`, `warning`, `complete`, and `error`. Adapters may emit only capabilities declared by their profile. Unsupported capabilities fail visibly.

The invocation coordinator applies one deadline across attempts, limits automatic attempts to three, honors `Retry-After`, and otherwise uses exponential backoff with full jitter. Retry and fallback require safe idempotency. Fallback is never hidden and is denied after a committed tool or external effect.

Prompts, responses, tool payloads, credentials, and authorization headers are restricted data. They are excluded from logs, diagnostics, registries, fixtures, errors, and compatibility evidence.

Recorded compatibility fixtures use SHA-256 over UTF-8 content normalized to LF. Verification therefore remains deterministic when Git checks out the same fixture with CRLF on Windows, while any semantic fixture change still fails closed.
