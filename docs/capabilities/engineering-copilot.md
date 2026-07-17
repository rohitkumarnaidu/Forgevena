# Engineering Copilot

The engineering copilot produces read-only implementation plans from the local metadata index. It reuses Forgevena provider policies, credential handling, usage records, consent controls, and optional signed organization policy.

## Safety guarantees

- Source contents, credentials, and semantic vectors are excluded from provider context.
- Planning sends only the objective, index counts, bounded symbol and relationship metadata, and deterministic recommendations.
- `copilot plan` performs no provider call.
- `copilot run` previews by default and requires `--apply --yes` in non-interactive environments.
- Responses are returned to the caller but are not persisted automatically.
- The copilot cannot mutate project files. Any later implementation remains a separate preview-first operation.
- When an organization policy is active, `--principal` is mandatory and `provider.invoke` with the `engineering.plan` capability must be allowed.

## Usage

```powershell
forgevena index build --apply
forgevena index recommend
forgevena copilot plan "Improve release reliability" --provider ollama
forgevena copilot run "Improve release reliability" --provider ollama --dry-run
forgevena copilot run "Improve release reliability" --provider ollama --apply --yes
forgevena copilot run "Review deployment risks" --provider openai --principal dev@example.com --apply --yes
```

Only model API and local-model providers are supported. Agent-host providers are excluded because their execution environments may have mutation capabilities.
