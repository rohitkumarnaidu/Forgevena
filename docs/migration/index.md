# Migration and Upgrade

Always preview `upgrade` and back up registry state. Upgrades migrate managed workspace schemas and add missing assets; they do not rewrite existing project files.

```powershell
ai-workspace status
ai-workspace upgrade --dry-run --verbose
ai-workspace upgrade --apply
ai-workspace validate
```

If validation fails, apply `upgrade rollback --apply --yes`, then restore only from a verified snapshot. See [Migration guide](../MIGRATION_GUIDE.md), [Upgrade policy](../UPGRADE_POLICY.md), and [Compatibility matrix](../COMPATIBILITY_MATRIX.md).
