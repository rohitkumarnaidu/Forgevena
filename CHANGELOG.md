# Changelog

## Unreleased - Enterprise Foundation E1

- Added a locked, atomic, checksummed state engine with journals, snapshots, recovery, and compatibility for existing `.ai-workspace` paths.
- Migrated workspace, provider, plugin, MCP, cloud, policy, configuration, health, Render, and upgrade state to the shared engine.
- Upgraded encrypted credentials to salted Argon2id with PBKDF2 fallback, authenticated metadata, atomic rotation, and bounded encrypted history.
- Added structured CLI operation envelopes, stable error metadata, application context, and state/vault command groups.
- Added concurrency, corruption, transaction, vault-version, and tamper tests.

## 1.1.0 - Forgevena Brand Transition

- Renamed the public product and npm package to Forgevena: governed engineering from idea to production.
- Added the preferred `forgevena` CLI while retaining `ai-workspace` as a backward-compatible 1.x alias.
- Preserved `.ai-workspace/` as the project state directory to avoid breaking initialized repositories.
- Added migration guidance and updated package, release, website, and distribution identity.

## 1.0.0 - Stable Ready

- Established stable CLI, registry, additive bootstrap, provider, credential, MCP/plugin, cloud, upgrade, rollback, packaging, governance, LTS, security, community, and enterprise-support contracts.
- Added production documentation website, performance budgets, concrete examples, long-term maintenance policies, and v1 release governance.

## 0.2.0-rc.1 - Release Candidate 1

- Added safe enterprise project bootstrap and all supported templates.
- Added governed provider, credential, MCP, plugin, dashboard, Render, and cloud workflows.
- Added managed-asset rollback, health checks, release verification, packaging controls, and complete Phase 1–6 documentation.
- Hardened dashboard token comparison and centralized structured-log secret redaction.
- Added centralized semantic version authority, safe registry migration/rollback, package-manager metadata generation, cross-shell completions, installers, and guarded release automation.
