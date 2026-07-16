# External Integration Operator Commands

All commands preview unless `--apply` is present. External actions prompt for consent; add `--yes` only in an explicitly approved non-interactive workflow. Never paste credentials into command arguments or chat.

## Provider Credentials and Connections

```powershell
node .\bin\ai-workspace.js credentials init --apply
node .\bin\ai-workspace.js providers configure openai --storage encrypted --apply
node .\bin\ai-workspace.js providers configure claude --storage encrypted --apply
node .\bin\ai-workspace.js providers configure gemini --storage encrypted --apply
node .\bin\ai-workspace.js providers configure openrouter --storage encrypted --apply

node .\bin\ai-workspace.js credentials validate openai
node .\bin\ai-workspace.js providers verify openai --apply
node .\bin\ai-workspace.js providers verify claude --apply
node .\bin\ai-workspace.js providers verify gemini --apply
node .\bin\ai-workspace.js providers verify openrouter --apply
node .\bin\ai-workspace.js providers doctor

node .\bin\ai-workspace.js credentials rotate openai --storage encrypted --apply
node .\bin\ai-workspace.js credentials backup --apply
node .\bin\ai-workspace.js credentials remove openai --apply
```

Set `AI_WORKSPACE_CREDENTIAL_KEY` through your OS credential store before encrypted operations. OpenAI uses `OPENAI_API_KEY`, Anthropic uses `ANTHROPIC_API_KEY`, Gemini uses `GEMINI_API_KEY`, and OpenRouter uses `OPENROUTER_API_KEY`.

## Ollama

```powershell
ollama serve
node .\bin\ai-workspace.js providers doctor ollama
node .\bin\ai-workspace.js providers models ollama
node .\bin\ai-workspace.js providers verify ollama --apply
```

Set `OLLAMA_HOST` only when Ollama is not available at `http://127.0.0.1:11434`.

## MCP

```powershell
node .\bin\ai-workspace.js mcp add example --transport http --url https://mcp.example.com/mcp --header-environment-json '{"Authorization":"EXAMPLE_MCP_AUTH"}' --apply
node .\bin\ai-workspace.js mcp validate example
node .\bin\ai-workspace.js mcp health example --apply
node .\bin\ai-workspace.js mcp activate example --host codex --apply
node .\bin\ai-workspace.js mcp deactivate example --host codex --apply
node .\bin\ai-workspace.js mcp remove example --apply
```

## Render

```powershell
node .\bin\ai-workspace.js cloud render generate
node .\bin\ai-workspace.js cloud render generate --apply
node .\bin\ai-workspace.js cloud render credentials --storage encrypted --apply
node .\bin\ai-workspace.js cloud render validate
node .\bin\ai-workspace.js cloud render configure --service-ids srv_123 --workspace-id tea_123 --apply
node .\bin\ai-workspace.js cloud render plan
node .\bin\ai-workspace.js cloud render deploy --apply
node .\bin\ai-workspace.js cloud render status --apply
node .\bin\ai-workspace.js cloud render rollback
```

## Vercel, Railway, Fly.io, Azure, AWS, Google Cloud, DigitalOcean

Replace `<cloud>` with `vercel`, `railway`, `flyio`, `azure`, `aws`, `googlecloud`, or `digitalocean`.

```powershell
node .\bin\ai-workspace.js cloud <cloud> prepare
node .\bin\ai-workspace.js cloud <cloud> prepare --apply
node .\bin\ai-workspace.js cloud <cloud> credentials --storage encrypted --apply
node .\bin\ai-workspace.js cloud <cloud> validate
node .\bin\ai-workspace.js cloud <cloud> verify --apply
node .\bin\ai-workspace.js cloud <cloud> deploy
node .\bin\ai-workspace.js cloud <cloud> deploy --apply
node .\bin\ai-workspace.js cloud <cloud> status --apply
node .\bin\ai-workspace.js cloud <cloud> health
node .\bin\ai-workspace.js cloud <cloud> rollback
node .\bin\ai-workspace.js credentials rotate <cloud> --storage encrypted --apply
node .\bin\ai-workspace.js credentials remove <cloud> --apply
```

Required CLIs are `vercel`, `railway`, `flyctl`, `azd`, `aws`, `gcloud`, and `doctl`. Azure, AWS, and Google Cloud may require additional account identifiers and host-managed login/session configuration. Preflight reports missing configuration artifacts, credentials, or CLIs before consent is requested.

AWS verification and status are executable after authentication. AWS deployment intentionally stops at `account-specific-deployment-input` because selecting App Runner, ECS, Lambda, Elastic Beanstalk, or another target—and supplying source connection roles, networking, region, and IAM—is an account architecture decision. No read-only command is misrepresented as deployment.

## Dashboard and Unified Health

```powershell
node .\bin\ai-workspace.js dashboard
node .\bin\ai-workspace.js doctor
node .\bin\ai-workspace.js doctor --apply
```

The dashboard binds to loopback, reports provider/cloud/MCP/plugin/credential status, and never displays stored credentials. `doctor --apply` records a redacted health snapshot.
