# v1.4.0-rc.1 Local Smoke Validation

> **Scope:** Retained local release-candidate evidence. This record does not certify live provider compatibility or stable release readiness.
> **Release:** `v1.4.0-rc.1`
> **Release commit:** `41fe1f47fbc744425a4fe15773ca0aa12522c386`
> **Tag:** signed and verified with the registered maintainer key
> **Recorded:** 2026-08-05

## Completed Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Local package test and release gate | Passed | `npm test`, `npm run release:verify`, `npm pack --dry-run` |
| Published npm package | Passed | Isolated `npm install --prefix <temporary-directory> forgevena@1.4.0-rc.1 --ignore-scripts` |
| Preferred and legacy CLI | Passed | Installed `forgevena version` and `ai-workspace doctor --structured` |
| Published Windows binary | Passed | Downloaded `forgevena-win-x64.exe`; `version` and read-only `doctor --structured` succeeded |
| Published Linux binary | Passed | Downloaded `forgevena-linux-x64` in Ubuntu 24.04 WSL; `version` and read-only `doctor --structured` succeeded |
| Docker CLI | Passed | Non-root Node 22 image build; `version`, read-only `doctor --structured`, and read-only mounted-workspace `init --dry-run --structured` succeeded |
| Provider, resilience, migration, and rollback suite | Passed | 46 focused tests: adapter, registry, runtime, streaming, compatibility, coordinator, and upgrade fixtures |
| Hosted release workflow | Passed | Windows, Ubuntu, and macOS verification; standalone builds; GitHub Release; npm; GitHub Packages; and GHCR publishing |

## Safety Observations

- `doctor` returned a successful read-only envelope and reported unconfigured providers, clouds, and optional tooling as attention items; it made no managed workspace changes.
- `init --dry-run` reported only proposed additive assets and preserved existing project files through the skip-only merge policy.
- Provider smoke checks used no credentials and did not transmit prompts, source content, or secret material.

## Remaining Stable-Promotion Gates

1. Credential- and consent-gated live smoke evidence for OpenAI, Anthropic/Claude, Gemini, OpenRouter, and a pinned local Ollama endpoint.
2. Clean released-artifact install, upgrade, rollback, offline, cancellation, and uninstall rehearsals on macOS and Linux. Windows and Ubuntu standalone smoke evidence is retained.
3. Dated provider compatibility records with model/server versions, expiry, limitations, and sanitized evidence.
4. Final stable-tag publication and post-release documentation, installation, health, rollback, and channel verification.

The RC remains a prerelease under npm `next`; no stable claim is made by this evidence.
