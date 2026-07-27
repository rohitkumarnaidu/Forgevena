# Release History Preparation

## v1.3.0

Minor release certifying the reliability and security foundation: decomposed CLI routing, transactional and recoverable state, encrypted vault lifecycle, deterministic corruption and concurrency evidence, enforced coverage and mutation gates, performance budgets, managed documentation ownership, and migration compatibility for published 1.1 and 1.2 workspaces.

## v1.2.3

Patch release for packaging host-specific Argon2 native bindings into standalone executables and enforcing Windows, Linux, and macOS standalone smoke tests during pull-request package validation. The failed immutable `v1.2.2` tag remains unchanged and published no npm package or GitHub Release.

## v1.2.2

Patch release for deterministic standalone Windows, Linux, and macOS executables; auditable OS/Node verification evidence; corrected Homebrew, Winget, and Chocolatey bundles; restricted-environment test execution; and synchronized release documentation. No public CLI or project-state compatibility break is introduced.

## v1.2.1

Patch release for cross-platform CI reliability, production GitHub Pages deployment, explicit schema-v1 vault migration controls, restored generated references, and validated workflow/documentation dependency upgrades. No public CLI or project-state compatibility break is introduced.

Published through npm, GitHub Releases, GitHub Packages, GHCR, and Docker Hub. The follow-up release-engineering change consolidates future signed-tag publication into one automated workflow while preserving protected approvals and immutable-version checks.

## v0.1.0-alpha

Initial CLI and safety-model validation. Experimental contracts, preview-first writes, and early project detection.

## v0.5.0-beta

Feature-complete foundation and integration lifecycle for beta evaluation. No production stability commitment.

## v0.9.0-rc.1

Release-candidate hardening, cross-platform checks, package validation, documentation, and managed rollback evidence.

## v1.0.0

Stable architecture, additive bootstrap, providers, credentials, MCP/plugins, cloud preparation, release governance, and compatibility commitments.

These historical notes document release intent. Tags and assets must only be created when the corresponding source state and checksums are available; retroactive tags must never misrepresent repository history.
