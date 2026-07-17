# Local Project Index

Forgevena indexes project metadata locally: file paths, sizes, SHA-256 hashes, source symbols, documentation headings and links, manifest dependencies, and import relationships. Source and documentation contents are never stored in the index.

```powershell
forgevena index build --dry-run
forgevena index build --apply
forgevena index status
forgevena index query provider adapter
forgevena index query dependency --limit 10
forgevena index recommend
```

The scanner skips Git state, Forgevena state, dependencies, build outputs, caches, virtual environments, and inaccessible generated directories. Querying is deterministic lexical matching. Semantic embeddings are a separate optional capability and are not enabled by this index.

`index recommend` produces deterministic, read-only engineering recommendations from indexed metadata. It never edits project files, reads stored source content, or invokes an AI provider. Any future action based on a recommendation remains subject to preview and explicit consent.
