# AI Provider Architecture

Provider configuration is project-scoped and capability-aware. Direct adapters support OpenAI, Anthropic, Gemini, and OpenRouter model APIs. Host adapters support only verified Codex, Cursor, or Windsurf capabilities detected on the current machine.

Credentials are never stored in the registry, templates, logs, or committed configuration. Development may create a new ignored `.env` through masked input; production uses environment variables or an external secret manager. Live calls require explicit data-egress consent and store usage counters only.
