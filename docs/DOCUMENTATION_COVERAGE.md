# Documentation Coverage Report

Audit date: 2026-07-16. Release: 1.0.0.

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
| Architecture decisions | 11 | `docs/adrs/index.md` | Complete |
| Core workflows | bootstrap, rollback, provider, integration, MCP/plugin, Docker/cloud, upgrade/release | domain guides and diagrams | Complete |

## Quality checks

- Canonical navigation and cross-links are present.
- Mermaid diagrams cover architecture, bootstrap, providers, plugins/MCP, and registry.
- Safety, errors, exit codes, environment variables, troubleshooting, testing, development, operations, and maintenance are documented.
- Historical phase/audit/release documents are preserved and linked from domain guides.
- A source-backed automated test verifies expected documents and named surfaces.

## External execution boundary

Documentation describes complete software-controlled paths. Live provider requests, hosted deployment, billing, package publication, and third-party account actions still require operator credentials and explicit consent; this is an operational boundary, not a documentation gap.
