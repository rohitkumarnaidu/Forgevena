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
node .\bin\ai-workspace.js credentials validate openai --apply
node .\bin\ai-workspace.js credentials rotate openai --storage encrypted --apply
node .\bin\ai-workspace.js credentials backup --apply
node .\bin\ai-workspace.js credentials remove openai --apply
```

Encrypted files use AES-256-GCM. The encryption key is never stored by the workspace and must come from an OS credential store or approved secret manager. Rotation archives the prior managed ciphertext; removal quarantines managed files instead of deleting them. Environment-owned credentials must be rotated and removed through their owning system.

### Named Key Slots

A provider can keep multiple locally managed keys. `primary`, `personal`, `work`, and `staging` are suggested slot IDs; custom lowercase IDs may contain letters, numbers, and hyphens. `primary` keeps the existing 1.x path and remains compatible with existing workspaces.

```powershell
forgevena credentials configure gemini --key-id personal --apply
forgevena credentials configure gemini --key-id work --storage encrypted --apply
forgevena credentials keys gemini
forgevena credentials activate gemini --key-id work --apply
forgevena credentials rotate gemini --key-id work --storage encrypted --apply
forgevena credentials remove gemini --key-id personal --apply
forgevena credentials recover gemini --key-id personal --apply
```

Only the active managed slot is used after a process environment variable check. Environment values remain an external, read-only override. Values are never shown by the CLI, dashboard, registry, metadata, audit history, or diagnostic output. Removing a managed slot quarantines it for 30 days; recovery validates the saved format and never overwrites a current key. If another slot is active, select `--next-key-id <id>` before quarantining it.

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

The dashboard binds only to `127.0.0.1`, uses an in-memory session token, sets restrictive browser headers, and does not display stored credentials. It presents a keyboard-operable provider workspace with credential-availability, compatibility freshness, policy, local configuration, and consented-health-test states. Its sidebar sections scroll to live provider, integration, and compatibility-evidence data; the light/dark preference is stored only in the current browser's local storage. Credential values are accepted only in masked fields, cleared after submission, and never returned to the browser; a provider test always requires a confirmation because it transmits the fixed health prompt to the selected provider.

The provider card’s **Key slots** panel lists metadata only and can add, activate, rotate, quarantine, and recover managed slots. Quarantining an active slot requires selecting an explicit replacement from the displayed managed slots. It never displays a stored value. The dashboard persists neither credentials nor usage content in browser storage.

Each provider card also has an explicit model control. Hosted providers accept a validated model ID; Ollama presents models already discovered by the local status check. Saving a model changes only the provider profile metadata and never sends a request to a hosted provider. A consented health test stores at most 20 metadata-only records locally: provider, model, operation ID, numeric usage, evidence ID, warning codes, and timestamp. Prompts and response content are neither returned to the browser nor retained in this history.

## Project Routing and Ollama

```powershell
node .\bin\ai-workspace.js providers project --default ollama --fallback openai --embedding-provider openai --model llama3.2 --priority ollama,openai --apply
node .\bin\ai-workspace.js providers doctor ollama
node .\bin\ai-workspace.js providers models ollama
node .\bin\ai-workspace.js providers test ollama --apply
```

Ollama defaults to `http://127.0.0.1:11434`; override it with `OLLAMA_HOST`. Local prompts are sent only to that configured local endpoint. Project routing stores model and policy metadata only, never credentials.
