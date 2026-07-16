# Security Guide

## Boundaries

- Project writes are preview-first and additive; existing files are skipped.
- External actions require `--apply --yes` and disclose scope and data impact.
- Credentials are accepted only through masked prompts or environment/secret-manager references.
- Local encrypted credentials require `AI_WORKSPACE_CREDENTIAL_KEY`; secrets are excluded from registries, exports, logs, and packages.
- Dashboard access is loopback-only, protected by a random in-memory token, origin checked, body limited, and compared in constant time.
- MCP endpoints reject inline credentials; non-loopback HTTP endpoints require HTTPS.
- Remote plugins must be declarative, signed with Ed25519, and trusted explicitly. Executable plugin manifests are rejected.

## Operations

Run `npm audit --omit=dev`, `npm test`, `npm run release:verify`, and `npm pack --dry-run` before release. Rotate or remove credentials with the commands in `EXTERNAL_INTEGRATION_COMMANDS.md`. Never commit `.ai-workspace/local-secrets/` or `AI_WORKSPACE_CREDENTIAL_KEY`.

## Reporting

Do not include real credentials or sensitive customer data in a vulnerability report. Report the affected version, reproducible behavior, impact, and remediation suggestion privately to the maintainer.
