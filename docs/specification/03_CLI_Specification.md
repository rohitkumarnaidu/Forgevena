# CLI Specification

Commands are discoverable through `--help`; writes require `--apply`. Read-only plans and status commands never trigger external actions. Project, provider, MCP, plugin, Docker, and Render operations return structured JSON for humans and automation.

Phase 5 adds `dashboard`, provider invocation/policy/authentication, governed MCP lifecycle, declarative plugin lifecycle, and `cloud render` generation/deployment commands. Existing files remain skip-only across every command.
