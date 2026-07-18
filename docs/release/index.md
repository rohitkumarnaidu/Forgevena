# Release Engineering

## Required evidence

- Full automated tests and documentation coverage.
- Dependency audit, security scan, and marker/secret scan.
- Performance benchmark and regression review.
- npm archive inspection and clean install.
- Docker CLI build and smoke test.
- Windows, Linux, and macOS hosted CI.
- Machine-readable and human-readable release verification reports with links to every required OS/Node job.
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

## Distribution channels

Signed tags automatically generate release notes and publish the GitHub Release, npm package, GitHub Package, GHCR image, Docker Hub image, smoke-tested standalone executables, distribution manifest, checksums, and supply-chain evidence through protected GitHub Actions. Winget, Chocolatey, and Homebrew remain external review processes that consume the immutable release assets.

See [Release Checklist](../RELEASE_CHECKLIST.md), [Release Guide](../RELEASE_GUIDE.md), [Final Readiness](../rc/FINAL_RELEASE_READINESS.md), and [1.0.0 Notes](../RELEASE_NOTES_1.0.0.md).
