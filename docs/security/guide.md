# Security Guide

## Security model

- Preview-first and additive-only project writes.
- Explicit consent for external commands, network access, deployment, and managed rollback.
- Least-privilege declarative plugins and host-scoped MCP activation.
- Recursive log redaction for credentials, authorization headers, prompts, responses, and MCP payloads.
- Loopback-only dashboard with a random token and constant-time comparison.

## Credentials

Credential precedence is process environment, the active encrypted managed slot, the active workspace-local ignored slot, then legacy `.env`. Configuration uses masked input. Plain local files are mode `0600` where supported; encrypted files use AES-256-GCM and a locally supplied encryption key. Named slots record metadata only; values are never returned by the CLI, dashboard, audit history, registry, or diagnostics. Managed validation records only a timestamp and key ID; process-environment validation remains externally owned.

```powershell
ai-workspace credentials list
ai-workspace credentials configure openai --apply
ai-workspace credentials validate openai --apply
ai-workspace credentials rotate openai --apply
ai-workspace credentials backup --dry-run
ai-workspace credentials remove openai --dry-run
ai-workspace credentials keys openai
ai-workspace credentials activate openai --key-id work --apply
```

Never commit `.env`, `.credentials/`, or `.ai-workspace/local-secrets/`. Removing a managed slot quarantines it for 30 days; recovery remains bounded and metadata-only audit records are retained. Process-environment values remain externally owned and cannot be changed by slot commands. Production deployments should reference the cloud provider's secret manager rather than copying development files.

The loopback dashboard keeps at most 20 metadata-only consented provider-test records. They may contain provider, model, operation ID, timestamp, numeric usage, compatibility evidence ID, and warning codes; prompts, responses, raw payloads, credential values, and authorization headers are prohibited from this record and from its API response.

## Incident response

If a credential may be exposed: revoke it at the provider, remove local state, rotate it with masked input, verify access, inspect redacted logs, and follow [Security response](../SECURITY_RESPONSE.md).

## Provider invocation

Prompts, responses, tool payloads, credentials, authorization headers, and raw provider payloads are restricted data. Provider invocation requires an explicit preview and transmission consent. Adapters return allowlisted metadata and normalized errors only; logs, diagnostics, compatibility fixtures, registries, and retained evidence must not contain restricted content. Automatic retry is limited to read-only or explicitly idempotent requests, and fallback stops on capability, trust, privacy, region, budget, or committed-tool-effect mismatches.
