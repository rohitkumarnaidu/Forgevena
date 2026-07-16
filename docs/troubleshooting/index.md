# Troubleshooting

| Symptom | Diagnosis | Resolution |
|---|---|---|
| Command not found | Global package/bin not on PATH | Reinstall archive/package and reopen shell. |
| Project not initialized | Registry absent | Run `init --dry-run`, then `init --apply`. |
| File skipped | Path already exists | Expected; inspect manually, never force overwrite. |
| Consent error | External action not approved | Review plan, rerun with `--apply --yes` if authorized. |
| Provider credential missing | No approved secret source | Run masked credential configuration or set environment variable. |
| Provider timeout/rate limit | Network or quota issue | Check status/policy; retries are bounded. |
| Ollama unavailable | Local daemon/model absent | Start Ollama and install the selected model. |
| MCP validation failure | Insecure URL/inline credential/schema issue | Use HTTPS (or loopback HTTP), remove inline auth, validate again. |
| Plugin disabled | Default safe state | Validate trust/signature, then explicitly enable. |
| Rollback skips a file | File changed since creation | Preserve it and resolve manually. |
| Docker validation fails | Missing/malformed template assets | Re-run template validation; do not overwrite custom files. |

Use `--verbose` and preserve redacted output when opening an issue. See [FAQ](../FAQ.md) and [Support](https://github.com/rohitkumarnaidu/Work-Space/blob/main/SUPPORT.md).
