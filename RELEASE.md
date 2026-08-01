# Release Engineering

This file is the stable repository entry point for Forgevena release engineering. The canonical maintained guidance is the [Release Engineering guide](docs/release/index.md).

Before promotion, complete the [Release Checklist](docs/RELEASE_CHECKLIST.md), validate the applicable [Change Readiness Scorecard](docs/governance/CHANGE_READINESS_SCORECARD.md), and retain release evidence as required by the [Documentation Synchronization Policy](docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md).

Published tags and release evidence are immutable. Never retag a release. Any code, metadata, documentation, package, or artifact correction requires the next semantic version.

The `v1.4.0` provider platform remains unreleased while its Tier-3 change is at the push checkpoint. A release candidate requires hosted cross-platform, Docker, migration, compatibility, and credential-gated live-provider evidence; local offline fixtures alone cannot promote provider support to stable.
