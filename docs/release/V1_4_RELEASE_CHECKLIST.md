# Forgevena v1.4.0 Release Checklist

## Implementation and RC3

- [x] ProviderAdapter v1 and shared provider domain services are implemented.
- [x] Five provider adapters pass the deterministic contract suite; this does not establish current live service availability.
- [x] Retry, deadline, cancellation, idempotency, budget, fallback, malformed-stream, migration, rollback, and redaction behavior is covered by tests.
- [x] Existing provider IDs, commands, state paths, structured output, and 1.x compatibility are preserved.
- [x] The implementation and credential-slot work merged through normal PR review. PR [#55](https://github.com/rohitkumarnaidu/Forgevena/pull/55) merged to `main` as `26755e5a62ead4caa4084818defe7d4b21346271`.
- [x] Signed `v1.4.0-rc.3` was published as a prerelease with checksums, SBOM, provenance, documentation evidence, package-manager bundles, and release verification. [RC3 release](https://github.com/rohitkumarnaidu/Forgevena/releases/tag/v1.4.0-rc.3).
- [ ] Tier-3 stable scorecard confirms critical controls at 100%, important controls at least 95%, standard controls at least 90%, and zero blockers.

## Live Provider Compatibility

- [ ] Owner-controlled, consented OpenAI smoke test passes and sanitized evidence is retained.
- [ ] Owner-controlled, consented Anthropic/Claude smoke test passes and sanitized evidence is retained.
- [x] Gemini `gemini-2.5-flash` smoke passed once on 2026-10-02; sanitized evidence is retained; preview claim only.
- [ ] Owner-controlled, consented OpenRouter smoke test passes and sanitized evidence is retained.
- [ ] Local Ollama inference passes against an installed, digest-pinned model. Two local model choices timed out at 60 seconds on 2026-10-02; the separate Ollama Cloud result does not satisfy this gate.
- [x] Ollama Cloud `gemma4:cloud` smoke passed once on 2026-10-02; preview evidence only, not local inference evidence.
- [ ] All five provider records identify model/server version, verification date, expiry, limitations, and sanitized evidence. Offline deterministic fixtures remain clearly distinct from live account tests.

Live requests require owner-controlled credentials and explicit consent. Never use leaked keys or retain prompts, responses, credentials, authorization headers, or raw provider payloads.

## Exact Published-RC3 Lifecycle

- [x] RC1, RC2, and RC3 tags remain immutable. RC2's documentation gate failed and produced no release assets; RC3 is the current published candidate.
- [ ] Run the manual [published-RC3 lifecycle workflow](https://github.com/rohitkumarnaidu/Forgevena/blob/main/.github/workflows/v1.4-stable-preflight.yml) against the exact GitHub Release archive on Windows, Linux, and macOS with Node.js 20 and 22.
- [ ] Verify the release archive against `RELEASE_SHA256SUMS` and exercise clean install, upgrade from 1.3.0, migration, rollback, offline install, cancellation, uninstall, and workspace preservation in all six OS/Node jobs.
- [ ] Download the six 90-day workflow artifacts, retain them under `docs/evidence/releases/v1.4.0/lifecycle/`, and record the workflow URL/run ID, source commit, verified artifact SHA-256, and scenario results in [stable-release-readiness.json](../evidence/releases/v1.4.0/stable-release-readiness.json).

## Stable Promotion Gate

- [ ] Complete the release scorecard, provider smoke evidence, and exact-artifact rehearsal evidence; run `npm run release:stable-gate` and require a `ready` result.
- [ ] In the reviewed promotion PR, set package metadata to exactly `1.4.0` only after RC3 and external evidence gates pass; merge that commit before creating the stable tag.
- [ ] Require the `v1.4 Stable Readiness` check on the promotion PR and verify it passes before merge; restrict `v1.4.0` tag creation to release owners through repository rules. These owner-managed GitHub settings are not validated by repository CI.
- [ ] Require normal PR review and hosted CI for all evidence and gate changes; no admin bypass.
- [ ] Configure the GitHub `stable-release` environment with a required approver and protect creation of the stable tag through repository rules. Environment approval gates publication; it does not replace pre-tag evidence or tag-creation protection.
- [ ] Only after the pre-tag gate passes, create and verify a new signed `v1.4.0` tag from the reviewed merge commit. Never move or reuse RC tags.
- [ ] Verify stable GitHub Release and downloadable artifacts, npm `latest`, GitHub Packages, GHCR and configured Docker Hub, checksums, SBOM, provenance, and final Pages deployment.
- [ ] Verify stable installation, health, version, rollback, and checksums after publication.

## Package-Manager Channels

- [ ] Update the Homebrew tap formula to `1.4.0`, use immutable artifact URLs and verified hashes, pass formula checks, and verify install/upgrade.
- [ ] Submit a new Winget `1.4.0` manifest PR after stable assets exist; wait for Microsoft validation, normal review, and merge; then verify the package version and installation.
- [ ] Submit a fresh Chocolatey `1.4.0` package, not a reopened `1.2.3`; include `LICENSE.txt`, verified checksum, install/uninstall behavior, provenance, and distribution-rights information. Wait for automated checks and human moderation.
- [ ] Update channel status documentation using observed upstream outcomes. A submission or pending review is not publication.

Chocolatey `1.2.3` was rejected on 2026-10-01 after inactivity. Preserve that result as historical evidence. Any correction after stable publication requires `v1.4.1`; published tags and package versions are immutable.
