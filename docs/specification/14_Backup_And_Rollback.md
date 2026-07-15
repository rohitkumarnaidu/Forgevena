# Backup and Rollback

Before an apply operation, the platform snapshots the registry and performs writes transactionally. If an operation fails, files created during that operation are removed and the registry is restored.

Rollback restores a selected registry snapshot. It intentionally does not delete project files created in prior successful transactions.
