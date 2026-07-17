# Local Diagnostics

Forgevena diagnostics are local-only. They provide aggregate metrics, bounded trace spans, health summaries, process profiles, crash codes, and diagnostic bundles without transmitting telemetry.

```powershell
forgevena diagnostics health
forgevena diagnostics metrics
forgevena diagnostics traces
forgevena diagnostics profile
forgevena diagnostics bundle --dry-run
forgevena diagnostics bundle --apply
```

Bundles are additive JSON files under `.ai-workspace/diagnostics/bundles/`. They contain version details, health counts, aggregate metrics, trace summaries, log filenames and sizes, and crash identifiers/codes. They exclude log contents, prompts, responses, API keys, tokens, credential metadata, and secret values.

Trace storage is bounded to 500 spans, crash storage to 100 records, and organization audit storage to 1,000 decisions. Sensitive keys and common token-like values are recursively redacted before persistence.
