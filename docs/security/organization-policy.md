# Local Organization Policy

Forgevena organization governance is local-only and does not require an account, server, telemetry, or network connection. An active policy bundle defines organizations, projects, workspaces, principals, roles, permissions, approved providers, approved plugins, approved templates, and capability rules.

Policy bundles use schema version 1 and must be signed with Ed25519 by a signer explicitly trusted in the workspace. Private signing keys are never stored by Forgevena.

```powershell
forgevena org trust security --public-key-file .\security-public-key.pem --dry-run
forgevena org trust security --public-key-file .\security-public-key.pem --apply
forgevena org import .\organization-policy.json --dry-run
forgevena org import .\organization-policy.json --apply
forgevena org validate
forgevena org evaluate --principal dev@example.com --action provider.invoke --resource provider:openai
forgevena org compliance
forgevena org audit
```

Evaluation is fail-closed. Unknown principals, missing matches, absent policies, and untrusted policies are denied. Explicit deny statements override every matching allow statement. Audit records contain identifiers and decisions only; prompts, responses, credentials, and tokens are excluded.

Policy imports update only the managed `.ai-workspace/org/policy.json` state document after signature verification. Workspace source files are never modified.
