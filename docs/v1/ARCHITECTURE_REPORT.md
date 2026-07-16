# Architecture Report — 1.0.0

The stable architecture separates CLI routing, additive project/bootstrap lifecycle, modules, integrations, providers, credentials, MCP/plugins, cloud/container adapters, registry, logging, and dashboard concerns. Managers own lifecycle state; the CLI does not bypass domain contracts.

The primary trade-off is deliberate conservatism: no overwrite or format merge, no automatic deletion of unmanaged state, explicit consent for external actions, and declarative rather than executable plugins. These constraints reduce automation breadth while preserving operator control and backward compatibility.

No new core abstraction is required for 1.0.0. Future architecture changes require a demonstrated problem and approved ADR.
