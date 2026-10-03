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

## Cross-platform package lifecycle rehearsal

Run the `npm-lifecycle` job in Package Validation on the supported Ubuntu, Windows, and macOS runners before promoting a release candidate. The job installs the last stable package into a disposable prefix, initializes a disposable workspace, upgrades it to the exact branch tarball, validates state, exercises rollback, performs an offline install from the warmed npm cache, and uninstalls the package. It must confirm the workspace state remains after uninstall. Never point this rehearsal at a personal or production workspace.

If a step fails, retain the runner logs and record the OS, Node.js version, package version, failing command, and workspace outcome. Do not retry against the same workspace until its state has been inspected. Recreate the temporary root for a clean retry; if rollback or state validation fails, stop promotion and investigate the snapshot/recovery path. A passing hosted macOS job is the macOS evidence; a Windows or Linux result cannot substitute for it. This deterministic package rehearsal does not count as live provider compatibility evidence or as stable-release approval.

### Published v1.4.0-rc.3 stable-promotion preflight

Use the manually dispatched `v1.4 Stable Promotion Preflight` workflow only after RC3 is published. It downloads the immutable `forgevena-1.4.0-rc.3.tgz`, verifies its published SHA-256, and exercises the baseline `1.3.0` upgrade, migration, rollback, offline install, cancellation, uninstall, and workspace preservation on Windows, Ubuntu, and macOS with Node.js 20 and 22. Review all six retained workflow artifacts; branch-built package checks do not substitute for this evidence. Failed jobs block promotion: retain their sanitized logs, inspect the disposable workspace, fix the cause through a reviewed change, and dispatch a fresh run. The workflow is not provider-live evidence, a readiness approval, or authorization to create the stable tag. The `stable-release` GitHub environment and repository tag rules must separately require the designated human approval and reviewed `v1.4.0` source.
