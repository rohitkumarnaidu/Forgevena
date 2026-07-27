# Forgevena v1.3.0 Release Checklist

## Source and compatibility

- [x] Version metadata is synchronized across `package.json`, `package-lock.json`, and `VERSION`.
- [x] Changelog, release notes, installation, compatibility, website, and generated references are synchronized.
- [x] The `forgevena` and `ai-workspace` executables remain compatible.
- [x] Existing `.ai-workspace` state paths and additive-only project behavior are preserved.
- [x] Unrelated media, archives, credentials, and local submission artifacts are excluded.

## Local evidence

- [x] 235 Node tests pass.
- [x] Overall coverage exceeds 90% lines, 85% branches, and 90% functions.
- [x] State and credential-vault coverage exceed their elevated thresholds.
- [x] The deterministic mutation gate exceeds 80% in every measured safety domain.
- [x] Exactly 32 concurrent state writers complete without lost updates.
- [x] 1,000 deterministic corruption cases fail without silent data loss.
- [x] State-read and warm-CLI performance budgets pass.
- [x] Generated documentation has zero drift.
- [x] Release and supply-chain verification pass locally.

## Hosted release evidence

- [ ] Pull-request CI passes on Windows, Ubuntu, and macOS with Node.js 20 and 22.
- [ ] Coverage, mutation, performance, package, documentation, dependency, and security checks pass.
- [ ] The release pull request is reviewed and merged.
- [ ] The signed `v1.3.0` tag resolves to the approved merge commit.
- [ ] npm, GitHub Release, GHCR, documentation, and downloadable assets publish successfully.
- [ ] Checksums, SBOM, provenance, verification reports, and native package bundles agree on version `1.3.0`.
- [ ] Clean-install and post-release smoke tests pass.

No published tag may be moved or reused. Any code or metadata correction after publication requires the next patch version.
