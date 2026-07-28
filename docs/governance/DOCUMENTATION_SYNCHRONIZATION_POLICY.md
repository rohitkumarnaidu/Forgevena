# Documentation Synchronization Policy

## Purpose

This policy makes documentation synchronization an enforceable engineering control. It is subordinate to the [Documentation Governance Standard](DOCUMENTATION_GOVERNANCE_STANDARD.md) and applies to source, tests, schemas, infrastructure, dependencies, user experience, security, releases, and documentation itself.

## Synchronization Contract

Every change follows this sequence:

```text
Detect changed files
→ Classify affected components and contracts
→ Determine required documentation evidence
→ Update implementation, tests, and documentation together
→ Validate generated and authored content
→ Retain impact evidence when risk or release policy requires it
→ Push, merge, or release only when all mandatory controls pass
```

The deterministic analyzer is `node scripts/documentation-impact.js`. It maps implementation paths to canonical guidance, generated references, tests, security material, migration guidance, and release evidence. A missing mandatory update produces a `hold` decision regardless of aggregate quality scores.

Run it before pushing:

```powershell
npm run docs:impact -- --working-tree --check
```

Compare two revisions exactly as CI does:

```powershell
npm run docs:impact -- --base <base-sha> --head <head-sha> --check
```

Generate the complete checksummed evidence bundle:

```powershell
npm run docs:impact -- --base <base-sha> --head <head-sha> --checkpoint merge --change-id <change-id> --owner <owner> --output-dir dist/documentation-evidence --check
```

## Change Classes

| Change | Required synchronization |
|---|---|
| CLI or public contract | CLI reference, generated reference, examples, compatibility notes, and tests |
| State, schema, persistence, or migration | Contract, architecture, migration, rollback, recovery, and corruption tests |
| Security, identity, policy, or credentials | Security guide, threat model, privacy impact, incident guidance, and negative tests |
| Provider, plugin, MCP, or external integration | Compatibility, permissions, data flow, support, health, failure behavior, and consent |
| Template, bootstrap, or generated project | Template reference, generated assets, upgrade behavior, rollback, and golden tests |
| UI, dashboard, or user journey | User guidance, accessibility, screenshots or visual evidence, interaction states, and tests |
| Infrastructure, deployment, or dependency | Deployment, operations, supply chain, compatibility, rollback, and release impact |
| Release or version | Changelog, release history, migration, known limitations, verification, packages, tags, and website |
| Documentation-only | Authority, metadata, navigation, links, examples, terminology, and freshness validation |

Not every change needs every artifact. `not-applicable` is permitted only with a written, reviewable rationale; critical controls cannot be waived through a composite score.

## Three Evidence Layers

1. **Change impact evidence:** what changed, affected components, expected documentation, changed documentation, tests, blockers, and decision.
2. **Readiness evidence:** the applicable [Change Readiness Scorecard](CHANGE_READINESS_SCORECARD.md), module gates, approvals, and waivers.
3. **Release evidence:** version agreement, migration, rollback, package/channel verification, SBOM, provenance, checksums, compatibility, and post-release review.

These layers complement rather than duplicate each other. Impact analysis identifies obligations; readiness proves quality; release evidence proves safe publication.

## Automation and CI

Documentation CI runs for every pull request, not only documentation path changes. It validates:

- deterministic documentation impact analysis;
- source-generated reference parity;
- governance metadata, ownership, authority, lifecycle, and freshness;
- Markdown, spelling, links, schemas, examples, Mermaid, accessibility, and strict site generation;
- roadmap, maturity, compatibility, version, release, and package claim consistency.

Documentation CI uploads the complete synchronization bundle even when the impact gate fails, so reviewers can inspect the exact missing obligations. The bundle contains ten required reports plus a checksummed manifest; release automation appends the release-specific synchronization summary to generated release notes.

External links run at the approved hosted-network boundary. Local validation must not silently transmit repository content or credentials.

## Reporting and Retention

Tier 2, Tier 3, release, migration, trust-boundary, and breaking changes retain Markdown and JSON evidence under `docs/evidence/changes/<change-id>/`. Tier 0 and Tier 1 changes may rely on generated CI evidence unless governance or reviewers require retention.

Reports distinguish facts from claims and include:

- documentation impact and updated-document list;
- missing-document and synchronization findings;
- coverage, quality, freshness, and authority results;
- migration, rollback, release, and version-history impact;
- unresolved debt with owner, priority, expiry, and acceptance evidence.

## Advanced Controls

The following controls are adopted as the documentation system matures:

- **Documentation dependency graph:** links code, schemas, ADRs, tests, guides, examples, releases, owners, and evidence.
- **Documentation bill of materials:** records generated inputs, tooling versions, checksums, licenses, and publication artifacts.
- **Executable example attestations:** records platform, command, expected result, verification date, and evidence hash.
- **Visual evidence fingerprints:** detects stale screenshots and diagrams without treating pixels as semantic truth.
- **Documentation SLOs:** tracks review latency, stale critical content, task success, search success, and recovery-guide rehearsal.
- **Break-glass governance:** emergency security or data-loss fixes may merge with minimum safe guidance, an owner, and a short expiry; complete synchronization remains mandatory immediately afterward.
- **Localization and accessibility provenance:** translated and alternative-format content identifies source version, reviewer, tooling, and freshness independently.

## Merge and Release Blockers

A change is not ready when required documentation is absent, generated references drift, examples fail, diagrams misrepresent implementation, evidence is stale, authority conflicts, migration or rollback is missing, compatibility is unsupported, screenshots are materially outdated, or release/version/package claims disagree.

Human reviewers retain final authority. Automation supplies deterministic evidence; it does not approve architecture, security risk, publication, billing, credentials, or external data transmission.

Only commands declared in `docs/examples/executable-evidence.json` and accepted by the hard-coded local, read-only allowlist may execute automatically. Shell interpretation, network commands, package installation, credential access, mutation flags, and external effects are prohibited. Visual assets are governed by `docs/assets/visual-evidence.json`; stale hashes, missing alternative text, expired review dates, changed source dependencies, and orphaned assets block validation.
