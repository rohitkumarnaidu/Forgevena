# Release Engineering

## Required evidence

- Full automated tests and documentation coverage.
- Dependency audit, security scan, and marker/secret scan.
- Performance benchmark and regression review.
- npm archive inspection and clean install.
- Docker CLI build and smoke test.
- Windows, Linux, and macOS hosted CI.
- Version manifest, checksums, release notes, compatibility, upgrade, rollback, and known-issues reports.

## Distribution channels

The npm package, GitHub release, Docker image, and standalone archive are technically prepared. Winget, Chocolatey, and Homebrew require public immutable release URLs and package-manager review. Docker Hub and npm publication require owner credentials.

See [Release Checklist](../RELEASE_CHECKLIST.md), [Release Guide](../RELEASE_GUIDE.md), [Final Readiness](../rc/FINAL_RELEASE_READINESS.md), and [1.0.0 Notes](../RELEASE_NOTES_1.0.0.md).
