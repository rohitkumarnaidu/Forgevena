# Release Guide

1. Update `package.json`, `package-lock.json`, `VERSION`, `CHANGELOG.md`, release notes, limitations, and compatibility evidence in a release pull request.
2. Run `npm audit --omit=dev`, `npm test`, `npm run test:coverage`, `npm run release:verify`, and `npm pack --dry-run`.
3. Merge only after hosted CI, documentation, security, dependency, and package checks pass.
4. Create and verify a signed semantic-version tag from the validated `main` commit.
5. Push the tag and approve the protected `npm-release` deployment.
6. Verify the automatically generated GitHub Release, npm package, GitHub Package, GHCR image, Docker Hub image, checksums, and provenance.
7. Use `Retry Package Publication` only for a failed registry job; never reuse or move a published tag.

Release rollback means deprecating the affected package version, publishing a corrected version, and communicating impact. Never reuse an already published semantic version.
