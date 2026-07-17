# Deterministic Workflows

Forgevena workflows are explicit versioned DAGs. Node order is deterministic, dependencies are validated, cycles are rejected, retries are bounded to five, and state is persisted after every attempt.

```powershell
forgevena workflows validate .\release-review.workflow.json
forgevena workflows plan .\release-review.workflow.json
forgevena workflows run .\release-review.workflow.json --run-id release-1 --dry-run
forgevena workflows run .\release-review.workflow.json --run-id release-1 --apply
forgevena workflows status release-1
forgevena workflows resume release-1 --approve production-deploy --dry-run
forgevena workflows resume release-1 --approve production-deploy --apply
```

Consent and mutating nodes pause before execution unless that node id is explicitly approved. Outputs and audit details are recursively redacted and hashed. Run state and the last 1,000 audit events remain under `.ai-workspace/workflows/runs/` for safe resumption and review.

The built-in executor supports only `noop` and `emit`. Provider, plugin, or project mutations must be supplied through reviewed host executors that reuse existing policy, consent, provider, plugin, state, and audit services.
