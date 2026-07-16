# Configuration Guide

Configuration lives in `.ai-workspace/config.json` and currently supports `output`, `logRetentionDays`, and `confirmApply`. Built-in defaults are used when the file is absent.

Use `ai-workspace config` to view values and `ai-workspace config <key> <value> --apply` to update them. Secrets are not accepted in configuration.
# Safe Transfer

```powershell
node .\bin\ai-workspace.js config export --output configuration.json --apply
node .\bin\ai-workspace.js config import --input configuration.json
node .\bin\ai-workspace.js config import --input configuration.json --apply
```

Exports contain provider routing and credential references/status only. Secret values, encrypted ciphertext, passwords, and private keys are rejected. Imports never overwrite an existing project provider configuration and never import credentials.
