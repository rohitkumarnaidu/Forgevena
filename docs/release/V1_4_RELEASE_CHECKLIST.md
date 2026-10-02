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

- [x] Pull-request CI passes on Windows, Ubuntu, and macOS with Node.js 20 and 22, including the required broken-link check. Evidence: [PR #53](https://github.com/rohitkumarnaidu/Forgevena/pull/53), CI run [37045796572](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796572), and link run [37045796725](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796725).
- [x] Hosted coverage, mutation, security, package, Docker, documentation, Mermaid, and link checks pass. Evidence: CI run [37045796572](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796572), security run [37045796670](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796670), Docs CI run [37045796895](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796895), package run [37045796995](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796995), and links run [37045796725](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37045796725).
- [ ] Tier-3 review confirms critical controls at 100%, important controls at least 95%, and standard controls at least 90%.
- [x] The implementation pull request is approved and merged without bypassing unresolved blockers. PR [#53](https://github.com/rohitkumarnaidu/Forgevena/pull/53) merged as `bbb56f7de055e8d60537c7117cbce9516a3b8592`.

## Live Compatibility Evidence

- [ ] Credential-gated and consent-gated OpenAI smoke test passes.
- [ ] Credential-gated and consent-gated Anthropic/Claude smoke test passes.
- [x] Credential-gated and consent-gated Gemini smoke test passes (2026-10-02; sanitized evidence retained; preview claim only).
- [ ] Credential-gated and consent-gated OpenRouter smoke test passes.
- [ ] Explicit local Ollama smoke test passes against a pinned version.
- [x] Ollama Cloud `gemma4:cloud` minimal smoke test passes (2026-10-02; preview evidence only; does not satisfy the local Ollama gate).
- [ ] Compatibility records include model or server versions, verification dates, expiry, limitations, and sanitized evidence.

## Release Candidate and Publication

- [x] Signed `v1.4.0-rc.1` is created from the approved release commit without moving any prior tag.
- [x] Candidate branch package lifecycle rehearsal passes on Ubuntu, Windows, and macOS: install stable `1.3.0`, initialize an isolated workspace, install the branch-built `1.4.0-rc.1` tarball, migrate, validate, roll back, install offline from the warmed cache, uninstall, and verify workspace preservation. Hosted evidence: [Package Validation run 37025295232](https://github.com/rohitkumarnaidu/Forgevena/actions/runs/37025295232) for source commit `071df0d` (Node.js 22 on `ubuntu-latest`, `windows-latest`, and `macos-latest`); local Windows rehearsal also passed.
- [x] Create and verify the signed `v1.4.0-rc.2` tag on merged PR #54. Its release workflow stopped at the mandatory documentation-impact gate (`provider-generated-reference` and `release-operations`); no RC2 artifacts or package channels were published. The immutable RC2 tag is retained and must not be moved or reused.
- [ ] Correct the generated provider reference and release-operation guidance in a reviewed change; prepare and validate a new immutable prerelease candidate before publication.
- [ ] Repeat the complete lifecycle rehearsal against the successfully published candidate artifacts on Ubuntu, Windows, and macOS, including install, upgrade/migration, rollback, offline install, uninstall, and workspace preservation.
- [x] RC SBOM, provenance, checksums, verification reports, and native package bundles agree on `1.4.0-rc.1`; stable assets must later agree on `1.4.0`.
- [ ] The signed stable `v1.4.0` tag is created only after all Tier-3 gates pass.
- [x] RC1 npm (`next`), GitHub Release, GitHub Packages, GHCR, and downloadable assets publish successfully. RC2 did not publish; verify `next` and all channels independently after a later candidate passes its release gate.
- [ ] Documentation deployment is verified against the final stable `v1.4.0` release commit.
- [ ] Post-release installation, health, rollback, and channel verification passes.

Any code, metadata, compatibility, or packaging correction after publication requires `v1.4.1`; published tags are immutable.
