# Phase 6 Dependency Report

## Inventory

- Runtime dependencies: none.
- Development dependencies: none.
- Required runtime: Node.js `>=20.19.0`.
- Optional external dependencies: Git, Docker, provider CLIs, cloud CLIs, and agent hosts selected by the user.

## Risk

The npm supply-chain surface is minimal. Node.js runtime security and optional third-party executable versions remain operator responsibilities. `npm audit --omit=dev` is part of the release gate even though the package currently has no npm dependencies.
