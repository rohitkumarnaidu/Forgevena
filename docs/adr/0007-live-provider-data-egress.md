# ADR 0007: Live Provider Data Egress

Live requests are disabled by dry-run defaults and require explicit external-action consent. Provider adapters send only the selected request and credential header. Prompts, responses, credentials, and authorization headers are never logged or stored in registries. Provider capabilities are declared individually; unsupported host operations fail closed.
