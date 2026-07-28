# Operations Runbooks

## Daily health

Run `doctor`, `status`, `validate`, integration health, provider status, and Docker validation. `doctor` is read-only unless `--apply` is explicit; use `doctor --apply` only when a retained local health snapshot and audit log are required. Treat missing optional tools as advisory and registry/schema failures as blocking.

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

For the CLI container, preserve `/workspace`, inspect the failed non-root command, and remove only the failed disposable container. The image stores no required state under `/opt/forgevena`; project state remains in the mounted workspace and follows the normal managed rollback contract.
