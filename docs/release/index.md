# Release Engineering

## Required evidence

- Full automated tests and documentation coverage.
- Dependency audit, security scan, and marker/secret scan.
- Performance benchmark and regression review.
- npm archive inspection and clean install.
- Docker CLI build and smoke test.
- Windows, Linux, and macOS hosted CI.
- Machine-readable and human-readable release verification reports with links to every required OS/Node job.
- A checksummed documentation synchronization bundle covering impact, quality, migration, version history, and repository health.
- Version manifest, checksums, release notes, compatibility, upgrade, rollback, and known-issues reports.
- CycloneDX 1.5 SBOM, in-toto/SLSA provenance statement, source checksums, lockfile validation, and secret-scan evidence.

```powershell
forgevena supply-chain verify
forgevena supply-chain scan
forgevena supply-chain generate --dry-run
forgevena supply-chain generate --apply
forgevena supply-chain artifacts
```

Generated evidence is additive under `dist/supply-chain/`. Existing evidence is never overwritten; create a clean release workspace for each immutable release.

Each automated GitHub Release also includes `RELEASE_VERIFICATION.md` and `release-verification.json`. These files record the release tag, immutable commit, workflow run, attempt, commands, and successful Windows, Ubuntu, and macOS jobs for Node.js 20 and 22. The same summary is appended to the release description automatically.

The release workflow also generates `documentation-evidence/`, validates its manifest and checksums, and appends its synchronization decision to release notes. Tier 2, Tier 3, migration, security, trust-boundary, breaking, and release changes retain the same evidence under `docs/evidence/changes/<change-id>/` before promotion.

Provider releases additionally require dated compatibility evidence for every stable support claim, credential-gated and consent-gated smoke tests, malformed-stream and fallback-denial evidence, registry migration and rollback exercises, and proof that restricted provider content is absent from retained artifacts. Offline fixtures may satisfy development gates but cannot independently satisfy stable certification.

## Distribution channels

Signed tags automatically generate release notes and publish the GitHub Release, npm package, GitHub Package, GHCR image, Docker Hub image, smoke-tested standalone executables, distribution manifest, checksums, and supply-chain evidence through protected GitHub Actions. Winget, Chocolatey, and Homebrew remain external review processes that consume the immutable release assets.

See [Release Checklist](../RELEASE_CHECKLIST.md), [Release Guide](../RELEASE_GUIDE.md), [v1.0–v1.4 Completion Matrix](V1_0_TO_V1_4_COMPLETION_MATRIX.md), [v1.3 Published Status](V1_3_IMPLEMENTATION_STATUS.md), [v1.4 Implementation Status](V1_4_IMPLEMENTATION_STATUS.md), [v1.4 Release Checklist](V1_4_RELEASE_CHECKLIST.md), [Final Readiness](../rc/FINAL_RELEASE_READINESS.md), and [1.0.0 Notes](../RELEASE_NOTES_1.0.0.md).
