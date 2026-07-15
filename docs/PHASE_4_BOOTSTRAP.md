# Phase 4: Enterprise Project Bootstrap

## Create a New Project

```powershell
node .\bin\ai-workspace.js create MyProject --template fastapi --provider codex --apply
```

Use `--dry-run` (the default) to preview additions. Use `--output <path>` to choose a destination. `create` only accepts an empty destination; use `init` for an existing repository.

## Stack-Owned Assets

The `react`, `nextjs`, `fastapi`, `express`, and `python` templates create their own starter source, Dockerfile, Compose file, GitHub Actions CI workflow, dependency policy, and Dependabot configuration. Template assets are planned before generic bootstrap assets, so a selected stack is never replaced with the generic `FROM scratch` placeholder.

These are secure starting points, not a deployment approval: set real runtime configuration, secrets, health checks, persistence, observability backends, and release ownership for the application before production deployment.

## Initialize an Existing Project

```powershell
node .\bin\ai-workspace.js init
node .\bin\ai-workspace.js init --apply
node .\bin\ai-workspace.js validate
```

`init` reports detected frameworks and protected directories. It never modifies `src`, `backend`, or `frontend`.

## Merge and Recovery

The implemented merge policy is `skip`. `--merge merge` and `--merge replace` are reported as requests but never overwrite files, including with `--force`. Use `--skip <module-or-path,...>` to omit additive assets from a bootstrap run. Registry rollback restores workspace state and preserves application files.

## Troubleshooting

Run `doctor` for prerequisite detection and `validate` after bootstrap. Resolve missing stack dependencies before replacing placeholder CI, Docker, or monitoring definitions with application-specific production configuration.
