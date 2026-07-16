# Cookbook

## Safe existing-project adoption

```powershell
ai-workspace doctor --verbose
ai-workspace init --dry-run --verbose
ai-workspace init --apply
ai-workspace validate
```

## Budget a provider

```powershell
ai-workspace providers limits openai --mode budgeted --monthly-request-limit 100 --max-output-tokens 2048 --apply
```

## Local-only model workflow

Start Ollama, run `providers models ollama`, initialize its profile, verify health, and invoke it. No API credential is required.

## Safe rollback

Run `rollback --dry-run`, inspect changed/unmanaged skips, then apply the specific operation with `--apply --yes`.
