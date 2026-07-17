# Changelog Automation Report

`cliff.toml` groups conventional commits into features, fixes, documentation, performance, refactoring, testing, CI, and maintenance. `.github/workflows/changelog.yml` runs for pull requests and manual review, generating an unreleased changelog preview.

`.github/workflows/release.yml` is the sole tag-driven GitHub Release publisher. It generates final release notes from the signed tag history, uses those notes as the release body, and uploads the same file with immutable release artifacts. This prevents duplicate release publishers and keeps the manual package workflow retry-only.
