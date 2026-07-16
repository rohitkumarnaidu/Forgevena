# Rollback Verification Report — 1.0.0

Automated tests verify that project rollback:

- previews by default;
- requires `--apply --yes`;
- enforces operation order;
- removes only manifest-owned files whose hashes remain unchanged;
- skips modified and unmanaged files;
- preserves registry state during preview.

Upgrade rollback separately restores a managed registry snapshot after explicit consent. External tool, cloud, and package-manager rollback remain upstream/operator actions described by generated plans. Result: **Pass**.
