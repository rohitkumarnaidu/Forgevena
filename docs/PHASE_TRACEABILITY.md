# Phases 1–4 Traceability

| Phase | Requirement | Evidence | Completion condition |
| --- | --- | --- | --- |
| 1 | Specifications and governance | `docs/specification/`, ADRs, governance guide | Documents match executable behavior. |
| 2 | CLI foundation and safe lifecycle | CLI, project, module, doctor, config, logging tests | Every documented command has tested behavior. |
| 3 | Tool integrations and provider preparation | Integration/provider registry, consent plans, health tests | No tool or secret is handled outside the declared lifecycle. |
| 4 | Bootstrap engine and templates | Template catalog, managed manifest, validation, E2E tests | All supported templates create validated, additive projects. |
| 5 | Live providers, dashboard, MCP/plugins, and Render | Provider runtime/policy, loopback dashboard, MCP/plugin registries, Render Blueprint/API tests | External operations are capability-aware, consent-gated, secret-safe, documented, and covered by automated tests. |

## Acceptance Evidence

Every completion claim requires passing automated tests, updated CLI help, updated user documentation, security and compatibility review, and a registry/schema note when persisted data changes.
# Phase 6

| Requirement | Implementation | Tests / Evidence |
| --- | --- | --- |
| Cross-platform package allowlist | `src/release.js`, `package.json` | `test/release.test.js`, `npm pack --dry-run` |
| Release CI verification | `.github/workflows/release.yml` | Windows/Linux/macOS and Node 20/22 matrix |
| Signed remote plugin distribution | `src/plugins.js`, `plugins trust` CLI | `test/mcp-plugins.test.js`, `test/integration-cli.test.js` |
| No private signing-key storage | Public-key-only trust registry | Plugin trust tests and documentation |

# Enterprise AI Ecosystem

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| Credential lifecycle | `src/credentials.js` | `test/credentials.test.js` |
| Provider routing and Ollama | `src/provider-project.js`, `src/provider-runtime.js` | `test/provider-project.test.js` |
| Multi-cloud preparation | `src/clouds.js` | `test/clouds.test.js` |
| Unified health/dashboard | `src/ecosystem-health.js`, `src/dashboard.js` | `test/ecosystem-health.test.js`, `test/dashboard.test.js` |
| Safe configuration transfer | `src/config-transfer.js` | `test/config-transfer.test.js` |
