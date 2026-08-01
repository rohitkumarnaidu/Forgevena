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

- [x] Pull-request CI passed on Windows, Ubuntu, and macOS with Node.js 20 and 22.
- [x] Coverage, mutation, performance, package, documentation, dependency, and security checks passed.
- [x] The release pull request was reviewed and merged.
- [x] The signed `v1.3.0` tag resolves to commit `004710388afa7f2888a0e2594ede2d3cde96fe1c`.
- [x] npm, GitHub Release, GHCR, documentation, and downloadable assets published successfully.
- [x] Checksums, SBOM, provenance, verification reports, and native package bundles agree on version `1.3.0`.
- [x] Clean-install and post-release smoke tests passed in the release workflow.

## Immutable publication evidence

- [GitHub Release v1.3.0](https://github.com/rohitkumarnaidu/Forgevena/releases/tag/v1.3.0)
- [Release workflow run 30292317567](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/30292317567)
- [npm package forgevena@1.3.0](https://www.npmjs.com/package/forgevena/v/1.3.0)
- [GHCR package](https://github.com/rohitkumarnaidu/Forgevena/pkgs/container/forgevena)

This checklist was reconciled on 2026-08-02 against immutable publication records. It preserves the historical assurance level of `v1.3.0`; it does not retroactively apply controls introduced after that release.

No published tag may be moved or reused. Any code or metadata correction after publication requires the next patch version.
