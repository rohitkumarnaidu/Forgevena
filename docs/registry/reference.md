# Registry and Managed Assets

The workspace registry is `.ai-workspace/workspace.json` (schema version 2). It records identity, platform version, template, modules, integrations, providers, and lifecycle timestamps. It must never contain secret values.

`.ai-workspace/managed-assets.json` records additive operations:

- operation identifier and timestamp;
- command/template/module metadata;
- registry snapshot;
- each created path and SHA-256 content hash.

```mermaid
flowchart LR
  Command --> Registry
  Command --> Manifest
  Manifest --> Hashes
  Rollback --> Manifest
  Rollback --> HashCheck
  HashCheck -->|unchanged| RemoveOwned[Remove owned file]
  HashCheck -->|changed| Skip
```

Registry migration is owned by the upgrade command. Back up before upgrades and do not hand-edit schema versions. Validate with `ai-workspace status` and `ai-workspace validate`.
