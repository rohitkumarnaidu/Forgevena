# Provider Adapter Contract

Forgevena provider adapters expose a versioned capability boundary over model APIs, local runtimes, and authenticated agent hosts.

Every adapter publishes its provider name, kind, credential reference, default model, declared capabilities, and known limitations. Operations fail closed when a capability is not declared.

Current adapter operations are:

- `metadata()` for compatibility discovery.
- `supports()` and `require()` for capability enforcement.
- `health()` for provider-specific readiness.
- `invoke()` for normalized generation or agent execution.
- `models()` for providers declaring model discovery.
- `auth()` for hosts declaring authentication status.

API retries preserve a stable idempotency key for supported providers, honor `Retry-After`, and otherwise use bounded exponential backoff with jitter. Provider prompts, responses, and credentials are excluded from logs.

Streaming, structured outputs, and tool calling are not advertised until their provider-specific implementations and contract tests are complete.
