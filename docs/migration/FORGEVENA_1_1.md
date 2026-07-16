# Migrating to Forgevena 1.1

Version 1.1 changes the public product and package identity without changing initialized project state.

## Install

```text
npm uninstall --global ai-engineering-workspace
npm install --global forgevena@1.1.0
forgevena version
forgevena doctor
```

## Compatibility contract

- `forgevena` is the preferred executable.
- `ai-workspace` remains an executable alias throughout the 1.x release line.
- `.ai-workspace/` remains the project state directory throughout 1.x.
- Existing registries, manifests, credentials, backups, and managed-asset records are not relocated.
- Existing source and configuration files are never rewritten by the rename.

No state migration command is required. A future state-directory change would require a major release, an ADR, a dry-run migration, backups, and explicit approval.
