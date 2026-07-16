# Security Guide

## Security model

- Preview-first and additive-only project writes.
- Explicit consent for external commands, network access, deployment, and managed rollback.
- Least-privilege declarative plugins and host-scoped MCP activation.
- Recursive log redaction for credentials, authorization headers, prompts, responses, and MCP payloads.
- Loopback-only dashboard with a random token and constant-time comparison.

## Credentials

Credential precedence is process environment, encrypted local file, workspace-local ignored file, then legacy `.env`. Configuration uses masked input. Plain local files are mode `0600` where supported; encrypted files use AES-256-GCM and a locally supplied encryption key.

```powershell
ai-workspace credentials list
ai-workspace credentials configure openai --apply
ai-workspace credentials validate openai
ai-workspace credentials rotate openai --apply
ai-workspace credentials backup --dry-run
ai-workspace credentials remove openai --dry-run
```

Never commit `.env`, `.credentials/`, or `.ai-workspace/local-secrets/`. Production deployments should reference the cloud provider's secret manager rather than copying development files.

## Incident response

If a credential may be exposed: revoke it at the provider, remove local state, rotate it with masked input, verify access, inspect redacted logs, and follow [Security response](../SECURITY_RESPONSE.md).
