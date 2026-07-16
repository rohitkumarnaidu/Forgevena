# ADR 0003: Secret Reference Only

## Decision

Provider and MCP configuration stores only environment-variable or secret-manager references. The workspace never stores, prompts for, or transmits provider API keys.

## Consequences

Live provider and MCP connections are implemented through provider-specific credential references, dry-run defaults, explicit consent, redacted logging, and project-scoped configuration. Secret values remain excluded from registries and source files.
