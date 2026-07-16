# Developer Guide

## Code structure

- `bin/`: executable entry point.
- `src/cli.js`: command routing only.
- `src/project.js`: additive project lifecycle.
- `src/templates.js` and `src/template-catalog.js`: module/project assets.
- `src/modules.js`, `src/integrations.js`, `src/providers*.js`: lifecycle domains.
- `src/credentials.js`, `src/mcp.js`, `src/plugins.js`: security-sensitive managers.
- `src/clouds.js`, `src/render.js`, `src/docker.js`: delivery adapters.
- `test/`: automated contract and regression coverage.

## Architecture rules

Reuse current managers; do not call adapters directly from arbitrary CLI branches. Preserve preview-first, exclusive-write, registry, redaction, consent, and dependency-injection patterns. New core abstractions require an ADR.

## Extension workflow

1. Document requirements and architecture impact.
2. Add metadata and lifecycle behavior to the existing domain.
3. Add unit, integration, and CLI tests.
4. Update this reference and help output.
5. Run tests, release verification, benchmark, and security checks.

Provider and integration additions must specify credential/data impact, health, status, rollback limits, and project artifacts. Plugin additions remain declarative.
