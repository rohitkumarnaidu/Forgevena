# Release Engineering

## Required evidence

- Full automated tests and documentation coverage.
- Dependency audit, security scan, and marker/secret scan.
- Performance benchmark and regression review.
- npm archive inspection and clean install.
- Docker CLI build and smoke test.
- Windows, Linux, and macOS hosted CI.
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

## Distribution channels

The npm package, GitHub release, Docker image, and standalone archive are technically prepared. Winget, Chocolatey, and Homebrew require public immutable release URLs and package-manager review. Docker Hub and npm publication require owner credentials.

See [Release Checklist](../RELEASE_CHECKLIST.md), [Release Guide](../RELEASE_GUIDE.md), [Final Readiness](../rc/FINAL_RELEASE_READINESS.md), and [1.0.0 Notes](../RELEASE_NOTES_1.0.0.md).
