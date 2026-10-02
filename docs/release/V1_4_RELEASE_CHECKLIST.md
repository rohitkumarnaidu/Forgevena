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
- [ ] Clean install, upgrade, migration, rollback, offline, cancellation, and uninstall rehearsals pass on all supported operating systems. Windows npm and standalone installation, Ubuntu standalone smoke, Docker, deterministic migration/rollback, cancellation, and hosted platform checks are retained; clean artifact-install and uninstall rehearsals remain for macOS and Linux.
- [x] RC SBOM, provenance, checksums, verification reports, and native package bundles agree on `1.4.0-rc.1`; stable assets must later agree on `1.4.0`.
- [ ] The signed stable `v1.4.0` tag is created only after all Tier-3 gates pass.
- [x] RC npm (`next`), GitHub Release, GitHub Packages, GHCR, and downloadable assets publish successfully.
- [ ] Documentation deployment is verified against the final stable `v1.4.0` release commit.
- [ ] Post-release installation, health, rollback, and channel verification passes.

Any code, metadata, compatibility, or packaging correction after publication requires `v1.4.1`; published tags are immutable.
