# Testing Guide

The platform uses Node's built-in test runner. Tests cover unit contracts, project creation/initialization, collision safety, registry and manifest behavior, rollback, providers, credentials, MCP/plugins, cloud plans, Docker, release packaging, and CLI paths.

```powershell
npm test
npm run release:verify
npm run benchmark
npm audit --omit=dev
```

The CLI startup gate performs one warm-up and evaluates the median of five measured launches. This preserves the 250 ms budget while preventing a single transient hosted-runner delay from creating a false regression.

## Writing tests

- Use temporary directories; never mutate a developer repository.
- Inject `fetch` and command execution doubles for remote services.
- Assert dry-run before apply behavior.
- Assert existing files remain byte-identical.
- Assert logs and structured outputs contain no credentials or payloads.
- Test Windows and POSIX path behavior where relevant.

Live credentials, billing, and remote deployments are not required in automated tests. Validate generated Docker/CI assets structurally; run container smoke tests only when Docker is available.
