# ADR 0003: Secret Reference Only

## Decision

Provider and MCP configuration stores only environment-variable or secret-manager references. The workspace never stores, prompts for, or transmits provider API keys.

## Consequences

Live provider and MCP connections remain a future phase with provider-specific authentication and data-use decisions.
