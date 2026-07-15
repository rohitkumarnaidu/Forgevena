# Phase 2 Foundation

## Implemented

- Safe CLI command dispatcher with structured JSON output, help, dry-run, apply confirmation, and exit-code propagation.
- Foundation module contract with initialize, validate, install, update, status, remove, and rollback lifecycle methods.
- Read-only project detector for Git, Node, Python, React, Next.js, FastAPI, Express, Flutter, Docker, package managers, and GitHub Actions signals.
- Project bootstrap engine with transactional writes, registry backups, no-overwrite behavior, and Git initialization for new projects.
- Project configuration defaults and validated persisted configuration.
- Project registry, separate command logs, rotation, rollback preview, provider and plugin extension boundaries.

## Deferred

External tool integrations, real provider integrations, and plugin execution are intentionally deferred to the next approved phase.

## Existing Project Initialization

`ai init` analyzes the current project and reports detected frameworks, existing signals, planned additions, skipped files, and protected application directories. Existing files use the `skip-existing-files` policy; merge and replace are intentionally unavailable until they have reviewable, format-aware implementations.
