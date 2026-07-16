# ADR 0008: Dual Credential Profiles

Development may use a newly created ignored `.env` populated through masked input. Existing `.env` files are never modified. Production profiles contain environment-variable or external-secret references only. Registries store availability/status metadata, never credential values.
