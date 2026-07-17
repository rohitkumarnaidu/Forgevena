# Changelog

## Unreleased

- Consolidated signed-tag releases into one automated pipeline that verifies the source, generates release notes, uploads immutable artifacts, creates or updates the GitHub Release, and publishes npm, GitHub Packages, GHCR, and Docker Hub distributions.
- Retained the manual package workflow as a retry-only recovery path and added idempotent npm and GitHub Packages publication checks.
- Corrected generated changelog links to the canonical `rohitkumarnaidu/Forgevena` repository.
- Updated the README and documentation homepage to the current stable release and added downloadable Homebrew, Winget, Chocolatey, SBOM, provenance, and checksum assets to automated releases.
- Added a safe workflow-dispatch repair path that rebuilds from an existing signed tag while skipping already-published immutable package versions.
- Updated the remaining active installation guides to 1.2.1 and made manual release repairs use the current canonical changelog configuration so historical repository links are corrected.

## 1.2.1 - 2026-07-17 - Release Reliability and Vault Migration

- Restored portable CI, documentation, package, release, and Markdown validation across Windows, Ubuntu, and macOS on Node.js 20 and 22.
- Enabled and validated GitHub Actions deployment for the production documentation site.
- Made schema-v1 credential vault compatibility explicit and consent-gated; normal reads reject legacy vaults, migration preserves an encrypted backup, and migrated secrets are immediately re-encrypted with Argon2id or PBKDF2-SHA-256 fallback.
- Restored canonical generated documentation and release references to the packaged source tree.
- Upgraded CodeQL, Node, Python, Docker publishing, MkDocs Material, Mike, and revision-date workflow dependencies after full hosted validation.
- Preserved the `forgevena` and `ai-workspace` CLI compatibility contract with no breaking project-state changes.

## 1.2.0 - 2026-07-17 - Enterprise Platform Foundations

- Added a locked, atomic, checksummed state engine with journals, snapshots, recovery, and compatibility for existing `.ai-workspace` paths.
- Migrated workspace, provider, plugin, MCP, cloud, policy, configuration, health, Render, and upgrade state to the shared engine.
- Upgraded encrypted credentials to salted Argon2id with PBKDF2 fallback, authenticated metadata, atomic rotation, and bounded encrypted history.
- Added structured CLI operation envelopes, stable error metadata, application context, and state/vault command groups.
- Added concurrency, corruption, transaction, vault-version, and tamper tests.
- Added a reusable command router with stable duplicate and unknown-command errors.
- Added vault integrity audit and fail-closed recovery from validated encrypted rotation history.
- Added a versioned provider adapter contract with capability enforcement and compatibility metadata.
- Added `Retry-After`, bounded jitter, and stable idempotency behavior for retryable provider requests.
- Added schema-v2 runtime plugins using isolated Node processes, JSON-RPC, permission declarations, output limits, and timeouts.
- Added a persistent runtime host with start, multi-invocation, status, reload, and deterministic stop lifecycle support.
- Added plugin platform-version constraints, dependency validation, cycle prevention, and permission/dependency inspection.
- Preserved canonical signatures for existing schema-v1 declarative plugins.
- Added versioned local template packages with inheritance, integrity checks, source containment, safe targets, and CLI verification.
- Added preview-first, additive export of built-in templates into independently verifiable local template packages.
- Added trusted Ed25519 template publishers, consent-gated HTTPS catalogs, immutable caching, and offline checksum/signature verification.
- Added signed local organization policy bundles with roles, approvals, fail-closed evaluation, deny-overrides semantics, compliance summaries, and bounded audit records.
- Added local aggregate metrics, bounded trace spans, crash records, health/profile commands, recursive value redaction, and additive secret-safe diagnostic bundles.
- Added deterministic CycloneDX SBOMs, in-toto/SLSA provenance, source checksums, repository secret scanning, threat modeling, and fail-closed release supply-chain verification.
- Added deterministic CLI, provider, module, and template reference generation with checksum manifests and fail-closed release drift detection.
- Added a signed prompt and engineering-skill registry with provenance, variables, compatibility constraints, immutable evidence, and fail-closed organization-policy approval.
- Added deterministic DAG workflows with dependency validation, bounded retries, resumable state, consent checkpoints, redacted outputs, hashes, and bounded audit records.
- Added a local metadata-only project index for source symbols, documentation headings/links, manifests, dependencies, imports, hashes, and deterministic queries.
- Added optional consent-gated semantic indexing through OpenAI, Gemini, or Ollama using approved metadata fields and embedding-only persistence.
- Added deterministic read-only project recommendations derived from metadata-only indexes, with explicit mutation-consent markers.
- Added a provider-backed read-only engineering copilot with metadata-only context, preview-first consent, and optional organization-policy enforcement.

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
