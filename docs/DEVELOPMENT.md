# Developer Guide

## Requirements

- Node.js `>=20.19.0`
- Git for repository initialization
- Optional provider/cloud CLIs only for their integrations

## Workflow

1. Read `AGENTS.md` and the relevant ADRs.
2. Keep changes additive and preserve public CLI behavior.
3. Add focused tests beside the affected subsystem.
4. Run `npm test`, `npm run release:verify`, and `npm pack --dry-run`.
5. Update CLI help and documentation when behavior changes.

The project intentionally has no runtime npm dependencies. Prefer Node.js built-ins unless a dependency provides clear security or maintenance value.
