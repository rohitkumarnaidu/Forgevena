# Configuration Guide

Configuration lives in `.ai-workspace/config.json` and currently supports `output`, `logRetentionDays`, and `confirmApply`. Built-in defaults are used when the file is absent.

Use `ai-workspace config` to view values and `ai-workspace config <key> <value> --apply` to update them. Secrets are not accepted in configuration.
