# Upgrade Report

`upgrade` previews registry changes. Apply creates a timestamped pre-upgrade backup, migrates schema 1 to schema 2, updates the workspace version, writes atomically, and records rollback state. `upgrade rollback --apply --yes` restores the exact backup. Automated tests verify preview, migration, versioning, backup, apply, and rollback.
