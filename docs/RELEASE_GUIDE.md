# Release Guide

1. Confirm the working tree contains only intended changes.
2. Run `npm audit --omit=dev` and review the result.
3. Run `npm test` and `npm run release:verify`.
4. Run `npm pack --dry-run`; verify local state and secrets are absent.
5. Update `CHANGELOG.md`, release notes, version manifest, limitations, and compatibility matrix.
6. Create and inspect the package in an isolated directory.
7. Publish only after maintainer approval and registry authentication.

Release rollback means deprecating the affected package version, publishing a corrected version, and communicating impact. Never reuse an already published semantic version.
