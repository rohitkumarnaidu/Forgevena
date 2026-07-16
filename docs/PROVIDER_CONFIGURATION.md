# Provider Configuration

```powershell
node .\bin\ai-workspace.js credentials init --apply
node .\bin\ai-workspace.js providers configure openai --apply
node .\bin\ai-workspace.js credentials status
```

`credentials init` creates an additive `.env.example` containing empty placeholders only. Provider configuration uses a masked interactive prompt and creates an isolated `.ai-workspace/local-secrets/<provider>.env` file. Existing files are never overwritten. Keys are never printed, logged, returned in CLI JSON, or written to the workspace registry.

Configure each required development credential separately:

```powershell
node .\bin\ai-workspace.js providers configure openai --apply
node .\bin\ai-workspace.js providers configure claude --apply
node .\bin\ai-workspace.js providers configure gemini --apply
node .\bin\ai-workspace.js providers configure openrouter --apply
node .\bin\ai-workspace.js providers configure cursor --apply
```

For CI and production, inject the documented environment variables through the platform secret manager instead of creating local files. Never paste keys into chat, command-line arguments, source files, provider profiles, or registry files.

## Credential Lifecycle

```powershell
$env:AI_WORKSPACE_CREDENTIAL_KEY = "load-this-from-your-OS-credential-store"
node .\bin\ai-workspace.js credentials configure openai --storage encrypted --apply
node .\bin\ai-workspace.js credentials validate openai
node .\bin\ai-workspace.js credentials rotate openai --storage encrypted --apply
node .\bin\ai-workspace.js credentials backup --apply
node .\bin\ai-workspace.js credentials remove openai --apply
```

Encrypted files use AES-256-GCM. The encryption key is never stored by the workspace and must come from an OS credential store or approved secret manager. Rotation archives the prior managed ciphertext; removal quarantines managed files instead of deleting them. Environment-owned credentials must be rotated and removed through their owning system.

## Supported Profiles

- OpenAI, Claude/Anthropic, Gemini, and OpenRouter support normalized text-generation requests.
- Codex and Cursor use their installed authenticated agent hosts when available.
- Windsurf exposes authentication/MCP readiness but no unverified headless invocation command.

## Policies and Invocation

```powershell
node .\bin\ai-workspace.js providers limits openai --mode guarded
node .\bin\ai-workspace.js providers limits openai --mode budgeted --monthly-request-limit 100 --max-output-tokens 2048 --apply
node .\bin\ai-workspace.js providers test openai --apply
node .\bin\ai-workspace.js providers invoke openai --model gpt-5.4-mini --prompt "Explain this project" --apply
```

Policies support `guarded`, `budgeted`, and explicitly selected `unrestricted` development modes. The usage ledger stores counts and character totals only, never content.

## Local Dashboard

```powershell
node .\bin\ai-workspace.js dashboard
```

The dashboard binds only to `127.0.0.1`, uses an in-memory session token, sets restrictive browser headers, and does not display stored credentials.

## Project Routing and Ollama

```powershell
node .\bin\ai-workspace.js providers project --default ollama --fallback openai --embedding-provider openai --model llama3.2 --priority ollama,openai --apply
node .\bin\ai-workspace.js providers doctor ollama
node .\bin\ai-workspace.js providers models ollama
node .\bin\ai-workspace.js providers test ollama --apply
```

Ollama defaults to `http://127.0.0.1:11434`; override it with `OLLAMA_HOST`. Local prompts are sent only to that configured local endpoint. Project routing stores model and policy metadata only, never credentials.
