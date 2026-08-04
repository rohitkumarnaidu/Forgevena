# Release Engineering

This file is the stable repository entry point for Forgevena release engineering. The canonical maintained guidance is the [Release Engineering guide](docs/release/index.md).

Before promotion, complete the [Release Checklist](docs/RELEASE_CHECKLIST.md), validate the applicable [Change Readiness Scorecard](docs/governance/CHANGE_READINESS_SCORECARD.md), and retain release evidence as required by the [Documentation Synchronization Policy](docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md).

Published tags and release evidence are immutable. Never retag a release. Any code, metadata, documentation, package, or artifact correction requires the next semantic version.

The `v1.4.0` provider platform remains unreleased after passing its Tier-3 merge checkpoint. Repository version `1.4.0-rc.1` prepares immutable candidate validation; it does not make `v1.4.0` stable. Candidate promotion requires release-checkpoint evidence, cross-platform installation and migration rehearsals, compatibility evidence, and protected signed-tag publication. Credential-gated live-provider evidence is mandatory before stable provider certification; local offline fixtures alone cannot satisfy that boundary.
