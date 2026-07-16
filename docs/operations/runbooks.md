# Operations Runbooks

## Daily health

Run `doctor`, `status`, `validate`, integration health, provider status, and Docker validation. Treat missing optional tools as advisory and registry/schema failures as blocking.

## Backup and restore

- Back up `.ai-workspace/` excluding local secrets unless an approved encrypted process covers them.
- Use `credentials backup --dry-run` before handling secrets.
- Use `upgrade --dry-run` before `upgrade --apply`.
- Restore an upgrade snapshot with `upgrade rollback --apply --yes`.

## Project rollback

Preview `rollback [operation]`. Apply only after confirming that changed files will be skipped. Re-run `validate` afterward.

## Provider outage

Check credential status, provider policy, network reachability, rate limits, and provider status. Use a configured fallback only when its data-use policy is equivalent. Do not log request payloads.

## Plugin or MCP failure

Disable the item, validate its definition, inspect redacted health output, verify publisher trust/TLS, and reactivate only after review.

## Deployment failure

Stop at the first failed preflight, preserve logs, run cloud status/health, execute only the generated rollback plan, and confirm billing/resource state in the provider console.
