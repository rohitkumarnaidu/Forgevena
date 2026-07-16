# FAQ

## Does initialization overwrite an existing project?

No. Run `init --dry-run` first. Existing files and application code are skipped.

## Are credentials stored in the registry?

No. Registries contain credential references and status only.

## Does a dry run contact external services?

No. External execution requires explicit apply and consent flags.

## Can rollback delete cloud resources?

No. It reports managed local assets and known-good redeployment guidance; external deletion is never automatic.

## Why is AWS deployment blocked?

AWS requires an account-specific target, IAM, source, networking, region, and billing decision. The platform refuses to invent that architecture.
