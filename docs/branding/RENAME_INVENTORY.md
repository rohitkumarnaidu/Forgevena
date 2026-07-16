# Rename Inventory

This inventory records current identifier classes; it is not a patch list and does not authorize modification.

## Runtime contracts

- Package: `ai-engineering-workspace`.
- Executable and entry file: `ai-workspace`, `bin/ai-workspace.js`.
- Persisted root: `.ai-workspace/` across project, registry, providers, credentials, policies, MCP, plugins, cloud, logging, health, backups, and upgrade code.
- Dashboard authentication header: `x-ai-workspace-session`.
- MCP client identity and Render fallback slug: `ai-workspace`.

## Distribution contracts

- npm archive and release workflow patterns.
- GitHub artifact `ai-workspace-release`.
- Homebrew `AiWorkspace`, Winget `RohitKumarNaidu.AIWorkspace`, Chocolatey `ai-workspace`.
- installer defaults and offline verification commands.
- Docker image/tag and generated checksums/release URLs.

## Documentation and repository identity

- Product titles throughout root policy files, 189 Markdown documents, website metadata, reports, examples, release notes, citation, and notices.
- GitHub repository URLs in MkDocs, distribution generation, workflows, issue templates, docs, and changelog config.
- GitHub Pages path and sitemap canonical URL.
- logos, favicon, alt text, SEO title/description, and social metadata.

## Generated-project compatibility

- `.gitignore` exclusions for `.ai-workspace` state.
- template documentation referring to AI Workspace state/configuration.
- provider profiles, integration docs, schemas, managed-assets manifests, and registry examples.

## Validation inventory

Tests and release verification directly assert the current package, executable, path, and generated artifacts. A rename change must add assertions for both preferred and compatibility names before removing any legacy assertion.

## Automated audit command

Before execution, generate a machine-readable manifest from exact searches for:

```text
AI Engineering Workspace
AI Developer Platform
ai-engineering-workspace
ai-workspace
.ai-workspace
Work-Space
Work Space
```

Exclude `.git`, caches, generated `dist`, archives, and approved historical release notes. Review binary assets and GitHub repository settings separately.
