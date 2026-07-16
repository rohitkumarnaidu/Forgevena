# Bootstrap and Project Lifecycle

`create` targets a new directory; `init` augments the current repository. Both call the same additive project engine.

## Managed transaction

1. Detect project and selected template.
2. Compute module and template assets.
3. Filter skipped items and existing paths.
4. Return preview unless `--apply` is present.
5. Snapshot registry state.
6. Create absent files using exclusive writes.
7. Record operation ID, paths, hashes, and metadata.
8. Validate structure, registry, and required template assets.

## Rollback

```powershell
ai-workspace rollback --dry-run
ai-workspace rollback <operation-id> --apply --yes
```

Rollback removes only manifest-owned files whose current hash still matches the created hash. Modified or unmanaged files are skipped and reported. Directories and external tools are not deleted.

## Existing repositories

Always run `init --dry-run --verbose` first. Application directories, source files, package manifests, and existing documentation are preserved. Merge and replace options currently remain skip-only by architecture decision.
