# AI Provider Architecture

Provider configuration is project-scoped and non-secret. Provider adapters describe supported hosts (Codex, Claude Code, Cursor, Gemini, and future hosts), instruction locations, and capabilities.

Credentials are never stored in the registry, templates, logs, or committed configuration; use environment variables or an external secret manager.
