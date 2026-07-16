# Changelog Automation Report

`cliff.toml` groups conventional commits into features, fixes, documentation, performance, refactoring, testing, CI, and maintenance. `.github/workflows/changelog.yml` runs on release tags and manual dispatch, generating a reviewable changelog artifact.

The existing release workflow remains the sole GitHub Release publisher, preventing duplicate releases. Maintainers may use the generated artifact as reviewed release-body input while GitHub-generated notes provide contributor attribution.
