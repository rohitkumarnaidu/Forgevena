# Release Checklist

- [ ] `package.json`, `package-lock.json`, `VERSION`, changelog, release notes, and compatibility evidence agree.
- [ ] Tests, coverage, dependency audit, release verification, documentation, and package inspection pass.
- [ ] Installation, upgrade, rollback, registry migration, and container smoke tests pass.
- [ ] Windows, Linux, and macOS standalone executables report the expected version and pass structured `doctor` smoke tests.
- [ ] The release preparation pull request is merged and its exact `main` commit is signed and tagged.
- [ ] `Automated Release` passes and the protected npm deployment is approved.
- [ ] npm Trusted Publishing matches `rohitkumarnaidu/Forgevena`, `release.yml`, and the `npm-release` environment; no long-lived npm publication token is configured.
- [ ] GitHub Release native assets, distribution manifest, checksums, provenance, npm, GitHub Packages, GHCR, and Docker Hub are independently verified.
- [ ] External Homebrew, Winget, and Chocolatey submissions reference the immutable release URL.
