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
3. Produce npm archive, SHA-256 checksums, and distribution manifests.
4. Create the signed tag and GitHub release.
5. Publish through protected workflows only.
6. Verify each registry independently.

Failed package versions are deprecated, not overwritten. Failed container tags are replaced only with a new semantic version.
