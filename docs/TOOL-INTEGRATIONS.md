# Tool Integrations

Every integration has metadata, detection, registration, project initialization, validation, health status, update metadata, registry-only removal, rollback limits, and documentation.

## Consent

Use `install <tool>` or `reference <name>` to inspect prerequisites, network/data impact, paths, and rollback guidance. Use `--apply` only after review; use `--apply --yes` in non-interactive sessions.

## Supported Tools

- OpenSpec, SkillOpt, and GitNexus have official command plans.
- gstack, claude-mem, and Understand Anything remain host-specific/manual workflows; the workspace records and validates their resulting artifacts instead of inventing installers.
- design.md creates or validates a project `DESIGN.md`; astryx remains a reference-only evaluation target.

## Provider and MCP Boundary

`providers init <name>` creates a non-secret profile. Phase 5 live calls require an explicit apply/consent step and transmit only the user-supplied request to the selected provider. MCP definitions store environment-variable references instead of header values. Declarative plugins are integrity-locked and disabled by default; executable remote plugin code is rejected.
