# Forgevena Compatibility Rename

Status: approved and implemented for version 1.1. Previous name: **AI Engineering Workspace**. Public name: **Forgevena**. The state directory remains unchanged by design.

## Rename surfaces

| Surface | Current contract | Proposed target | Risk |
|---|---|---|---|
| Product display | AI Engineering Workspace | Forgevena | Low |
| npm package | `ai-engineering-workspace` | `forgevena` | High: install and automation breakage |
| CLI executable | `ai-workspace` | `forgevena`, with legacy alias | High: scripts and docs breakage |
| State directory | `.ai-workspace/` | Unchanged during 1.x | Critical: project compatibility and rollback state |
| Dashboard header | `x-ai-workspace-session` | Unchanged during 1.x | High: clients/tests |
| MCP client identity | `ai-workspace` | Unchanged during 1.x | Medium |
| Repository | `rohitkumarnaidu/Work-Space` | Approved public repository slug | High: URLs, release assets, Pages |
| Website | GitHub Pages `Work-Space` path | Approved domain/repository path | High: links and SEO |
| Docker/distribution | `ai-workspace`, `AIWorkspace` manifests | Forgevena identifiers with compatibility | High: package channels |
| Documentation | product, command, paths, links | Forgevena plus migration notes | Medium |
| Assets | current logo/title metadata | approved Forgevena identity | Medium |

## Affected implementation areas

- `package.json`, lockfile, `VERSION`, package archive naming, npm provenance.
- `bin/ai-workspace.js`, CLI help/errors, shell completions, man pages.
- `src/project.js`, registry/config/credentials/logging/provider/MCP/plugin/cloud paths, dashboard header, release verifier, Render fallback slug.
- installer and distribution scripts; Homebrew class/formula, Winget ID, Chocolatey package ID.
- tests that assert executable, paths, package metadata, headers, and generated assets.
- README, policies, examples, documentation portal, MkDocs metadata/URLs, version history, citations, notices, changelog, and release notes.
- GitHub workflows, artifacts, Pages URLs, CODEOWNERS references, issue links, release assets, repository badges.
- generated project templates and `.gitignore` rules.

## Compatibility strategy

Use a two-release migration, not a flag-day rename.

### Compatibility release (recommended 1.x)

1. Add `forgevena` as the preferred executable while retaining `ai-workspace` as a deprecated alias.
2. Continue reading and writing `.ai-workspace/`; do not create a second state root yet.
3. Add product display branding without changing persisted schemas.
4. Publish deprecation warnings only in interactive/help output, never machine JSON.
5. Keep old package/repository redirects active and publish migration documentation.
6. Add registry metadata `productBrand` without changing schema semantics.

### Major release

1. Introduce `.teravyn/` through an explicit preview/apply migration with backup and rollback.
2. Read legacy state when new state is absent; never merge silently.
3. Retain the old CLI shim for one additional support window if package managers permit.
4. Update package channels only after new identifiers are reserved.
5. Preserve old documentation URLs with redirects and canonical links.

## Execution sequence

1. Legal/availability approval and name reservation.
2. ADR approving brand, package, CLI, state, repository, and compatibility decisions.
3. Freeze release branch and create a complete occurrence manifest.
4. Introduce centralized brand/identifier constants without changing values.
5. Add compatibility tests and migration fixtures.
6. Change display brand and assets.
7. Add CLI alias and package transition.
8. Update documentation, website, examples, workflows, and distribution manifests.
9. Introduce state migration only in an approved major version.
10. Run tests, documentation/link/Mermaid checks, strict site build, packaging, archive install, Docker smoke test, benchmarks, release verification, and hosted cross-platform CI.

## Rollback

Every pass must be a separate reviewed commit. Display/document changes can revert normally. Package/CLI publication rollback requires deprecating the bad package version and republishing a corrected version; published versions cannot be replaced. Repository rename relies on GitHub redirects but should retain the old owner/name reservation. State migration must have an operation manifest, content hashes, registry snapshot, explicit `--apply --yes`, and unchanged-file-only rollback.

## Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Existing projects become unreadable | Critical | Preserve legacy state through 1.x; migrate only by explicit major-version command. |
| Scripts lose executable | High | Dual executable aliases and deprecation window. |
| Package takeover/confusion | High | Reserve names before announcement; publish signed/provenance releases. |
| Broken release/download URLs | High | Repository redirects, old releases retained, URL validation. |
| Search/brand fragmentation | Medium | Canonical URLs, migration landing page, consistent metadata. |
| Trademark dispute | Critical | Professional clearance before any public rename. |
| Hidden identifiers remain | Medium | Automated occurrence manifest and zero-old-name gate with explicit allowlist. |

## Approval gate

Do not execute until maintainers approve: final legal name, GitHub organization/repository, npm/package-manager IDs, CLI name, state-directory policy, migration window, domain strategy, visual identity, and release version. Approval must be recorded in an ADR.
