# Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Command previews but does not write | Re-run the reviewed command with `--apply`; external actions also require `--yes`. |
| Existing file is skipped | This is intentional. Move or version-control the existing file; the platform never overwrites it. |
| Credential is unavailable | Run `credentials status`, configure it through the masked prompt, and verify `AI_WORKSPACE_CREDENTIAL_KEY` when encrypted storage is used. |
| Provider test fails | Run `providers doctor <name>`, verify the credential/model, network, timeout, account quota, and data-egress consent. |
| MCP health fails | Validate the URL and environment references, then run `mcp validate` and `mcp health`. |
| Cloud action is blocked | Generate/validate the artifact, configure credentials, install and authenticate the official CLI, then review the dry-run plan. |
| Rollback skips a file | The managed file was modified or is unmanaged. Restore it manually from version control. |
| Release verification fails | Resolve every reported package metadata or allowlist issue before packaging. |
