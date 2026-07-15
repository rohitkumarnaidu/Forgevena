# Provider Configuration

```powershell
node .\bin\ai-workspace.js providers configure openai --apply
```

The command uses a masked interactive prompt and creates `.env` only when it does not already exist. The key is never printed, logged, returned in CLI JSON, or written to the workspace registry. For existing `.env` files and non-interactive environments, set the documented variable manually through your secret manager or environment.
