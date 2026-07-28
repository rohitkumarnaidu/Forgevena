# Documentation Coverage Report

Audit date: 2026-07-28. Release: 1.3.0.

This human-readable summary is retained for compatibility. The generated [documentation catalog](reference/generated/documentation-catalog.json), [health report](reference/generated/documentation-health.md), and [coverage matrix](reference/generated/documentation-coverage-matrix.md) are the current evidence. Historical records are classified and indexed but are not counted as current product guidance.

| Surface | Source count | Canonical coverage | Status |
|---|---:|---|---|
| Top-level CLI commands | 24 | `docs/cli/reference.md` | Complete |
| Foundation modules | 16 | `docs/modules/reference.md` | Complete |
| Capabilities | 7 | `docs/capabilities/reference.md` | Complete |
| Integrations | 8 | `docs/integrations/reference.md` | Complete |
| Provider runtimes | 8 | `docs/providers/reference.md` | Complete |
| Credential profiles | 13 | `docs/security/guide.md`, environment reference | Complete |
| Project templates | 14 | `docs/templates/reference.md` | Complete |
| Cloud adapters | 8 | `docs/deployment/guide.md`, existing cloud guide | Complete |
| Configuration defaults | 3 | `docs/configuration/reference.md` | Complete |
| Architecture decisions | Retained records plus active index | `docs/adrs/index.md` | Governed |
| Core workflows | bootstrap, rollback, provider, integration, MCP/plugin, Docker/cloud, upgrade/release | domain guides and diagrams | Complete |

## Quality checks

- Canonical navigation, authority, ownership, lifecycle, and cross-links are validated.
- Mermaid diagrams cover architecture, bootstrap, providers, plugins/MCP, and registry.
- Safety, errors, exit codes, environment variables, troubleshooting, testing, development, operations, and maintenance are documented.
- Historical phase, audit, RC, and release documents are preserved and classified in the generated historical index.
- A source-backed automated test verifies expected documents and named surfaces.

“Complete” means the current documented surface has evidence for its declared scope. It is not a certification claim and does not imply that future roadmap capabilities are implemented.

## External execution boundary

Documentation describes complete software-controlled paths. Live provider requests, hosted deployment, billing, package publication, and third-party account actions still require operator credentials and explicit consent; this is an operational boundary, not a documentation gap.
