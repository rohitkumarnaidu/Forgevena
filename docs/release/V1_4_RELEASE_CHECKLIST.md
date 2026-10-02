# Forgevena v1.4.0 Release Checklist

## Software-Controlled Implementation

- [x] ProviderAdapter v1 and shared domain services are implemented.
- [x] Five committed provider adapters pass the deterministic contract suite.
- [x] Retry, deadline, cancellation, idempotency, budget, fallback, and malformed-stream behavior is tested.
- [x] Registry migration, rollback, corruption, and compatibility-freshness behavior is tested.
- [x] Restricted provider content is excluded from retained local artifacts.
- [x] Existing provider IDs, commands, state paths, and structured output remain compatible.
- [x] RFC, ADR, threat model, privacy review, schemas, traceability, and push-readiness evidence are retained.
- [x] Tests, coverage, mutation, package, standalone, Docker, governance, and strict documentation validation pass locally.

## Hosted Merge Evidence

- [x] Pull-request CI passes on Windows, Ubuntu, and macOS with Node.js 20 and 22.
- [x] Hosted coverage, mutation, security, package, Docker, documentation, Mermaid, and link checks pass.
- [x] Tier-3 review confirms critical controls at 100%, important controls at least 95%, and standard controls at least 90%.
- [x] The implementation pull request is approved and merged without bypassing unresolved blockers.

## Live Compatibility Evidence

- [ ] Credential-gated and consent-gated OpenAI smoke test passes.
- [ ] Credential-gated and consent-gated Anthropic/Claude smoke test passes.
- [ ] Credential-gated and consent-gated Gemini smoke test passes.
- [ ] Credential-gated and consent-gated OpenRouter smoke test passes.
- [ ] Explicit local Ollama smoke test passes against a pinned version.
- [ ] Compatibility records include model or server versions, verification dates, expiry, limitations, and sanitized evidence.

## Release Candidate and Publication

- [x] Signed `v1.4.0-rc.1` is created from the approved release commit without moving any prior tag.
- [x] Candidate branch package lifecycle rehearsal passes on Ubuntu, Windows, and macOS: install stable `1.3.0`, initialize an isolated workspace, install the branch-built `1.4.0-rc.1` tarball, migrate, validate, roll back, install offline from the warmed cache, uninstall, and verify workspace preservation. Hosted evidence: [Package Validation run 37025295232](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37025295232) for source commit `071df0d` (Node.js 22 on `ubuntu-latest`, `windows-latest`, and `macos-latest`); local Windows rehearsal also passed.
- [ ] Repeat the lifecycle rehearsal against the newly published immutable release candidate after this PR is merged. Because `v1.4.0-rc.1` is immutable and does not contain this branch's changes, publish a new prerelease version (for example, `1.4.0-rc.2`) rather than replacing or moving the RC1 tag.
- [x] RC SBOM, provenance, checksums, verification reports, and native package bundles agree on `1.4.0-rc.1`; stable assets must later agree on `1.4.0`.
- [ ] The signed stable `v1.4.0` tag is created only after all Tier-3 gates pass.
- [x] RC npm (`next`), GitHub Release, GitHub Packages, GHCR, and downloadable assets publish successfully.
- [ ] Documentation deployment is verified against the final stable `v1.4.0` release commit.
- [ ] Post-release installation, health, rollback, and channel verification passes.

Any code, metadata, compatibility, or packaging correction after publication requires `v1.4.1`; published tags are immutable.
