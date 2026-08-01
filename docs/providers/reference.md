# Provider Reference

## Supported providers

| Provider | Kind | Credential | Default model / execution | Capabilities |
|---|---|---|---|---|
| OpenAI | Model API | `OPENAI_API_KEY` | profile default | invocation, streaming, tools, structured output, health |
| Claude (Anthropic) | Model API | `ANTHROPIC_API_KEY` | profile default | invocation, streaming, tools, structured output, health |
| Gemini | Model API | `GEMINI_API_KEY` | profile default | invocation, streaming, tools, structured output, health |
| OpenRouter | Model API | `OPENROUTER_API_KEY` | `openrouter/auto` | invocation, streaming, tools, structured output, health |
| Ollama | Local model | none | `llama3.2` | invocation, streaming, tools, structured output, health, model discovery |
| Codex | Agent host | host auth or `OPENAI_API_KEY` | `codex exec` | agent execution, auth, MCP host |
| Cursor | Agent host | host auth or `CURSOR_API_KEY` | `cursor-agent` | agent execution, auth, MCP host |
| Windsurf | Agent host | host-managed | authenticated GUI host | auth status, MCP host |

## Configure and verify

```powershell
ai-workspace providers init openai --apply
ai-workspace credentials configure openai --apply
ai-workspace providers limits openai --mode budgeted --monthly-request-limit 100 --apply
ai-workspace providers verify openai
ai-workspace providers invoke openai --prompt "Return OK" --apply
ai-workspace providers stream openai --prompt "Return OK" --apply
```

Profiles store references, never secret values. Runtime requests enforce prompt, token, timeout, retry, and monthly request policies. Retryable failures use bounded exponential backoff; credentials and payloads are excluded from logs.

Use `providers update` to preview migration into `.ai-workspace/providers/registry.json`; add `--apply` to commit after the plan is reviewed. Compatibility evidence expires after 90 days for hosted providers and 180 days for pinned Ollama versions.

## Best practices

- Use environment variables or encrypted local storage for development; use an approved secret manager in production.
- Start with guarded or budgeted policy mode.
- Run `verify` before invocation and rotate credentials after suspected exposure.
- Prefer Ollama for workflows that must avoid remote data egress.

For failures, inspect provider status and credential status; never paste keys into issue reports. See [Security](../security/guide.md).
