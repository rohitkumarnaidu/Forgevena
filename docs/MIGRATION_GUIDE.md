# Migration Guide

## From 0.1.x to 0.2.0

- Run `status` and preserve the existing `.ai-workspace/` directory.
- Preview `init --dry-run`; apply only missing assets.
- Reconfigure credentials through masked prompts if migrating from unencrypted local files.
- Validate provider, MCP, plugin, and cloud registries before external actions.
- Existing project files are not migrated or overwritten automatically.
