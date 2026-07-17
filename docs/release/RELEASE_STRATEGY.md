# Release Strategy

Forgevena follows semantic versioning. Patch releases contain backward-compatible fixes, minor releases add backward-compatible behavior, and major releases may change documented contracts with migration and rollback support.

## Channels

- `alpha`: early design validation; no stability guarantee.
- `beta`: feature complete for the target scope; operational refinement remains.
- `rc`: release candidate; only blocking fixes and documentation changes.
- `stable`: all quality gates and release evidence pass.

## Tagging

```bash
git tag -s v1.2.1 -m "Forgevena v1.2.1"
git push origin v1.2.1
```

Use annotated tags (`git tag -a`) when signing infrastructure is unavailable, but record the exception. Never move or replace a published tag.

## Publication

1. Update `VERSION`, package metadata, changelog, migration notes, and supported versions.
2. Run tests, documentation, security, package, Docker, upgrade, and rollback gates.
3. Merge the release preparation through the protected `main` branch.
4. Create and push the signed tag from the validated release commit.
5. Allow `Automated Release` to generate changelog-based release notes, archives, checksums, supply-chain evidence, the GitHub Release, npm package, GitHub Package, and container images.
6. Approve the protected `npm-release` environment when requested.
7. Verify each registry independently.

The workflow marks semantic prerelease tags as GitHub prereleases and publishes npm `next`. Stable tags become the latest GitHub Release, publish npm `latest`, and update stable container tags. The manual `Retry Package Publication` workflow is recovery-only.

Failed package versions are deprecated, not overwritten. Failed container tags are replaced only with a new semantic version.
