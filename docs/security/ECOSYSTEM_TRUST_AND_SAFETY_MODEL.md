# Ecosystem Trust and Safety Model

> **Status:** Strategic trust model. It defines required outcomes, not current certification.

## Trust Principles

Trust is evidence, not popularity. Every claim identifies its issuer, scope, verification date, expiry, limitations, and revocation path. The client fails closed when required trust evidence is missing or invalid.

## Threats

- Publisher-account takeover, malicious transfer, and abandoned packages.
- Dependency confusion, namespace squatting, typosquatting, and downgrade attacks.
- Malware, credential theft, data exfiltration, sandbox escape, and excessive permissions.
- Compromised registries, mirrors, signing keys, build pipelines, or transparency records.
- Hidden paid ranking, fraudulent reviews, coordinated abuse, and unsupported certification claims.
- License violations, trademark abuse, privacy violations, and unsafe content.

## Controls

- Publisher identity, namespace proof, recovery contacts, ownership transfer, and succession.
- Offline-compatible signatures with pluggable trust roots and future Sigstore/TUF-style interoperability.
- Provenance, SBOM, reproducible fixtures, independent rebuild evidence, and immutable hashes.
- Permission declarations, isolation, resource limits, host-mediated capabilities, and default denial.
- Malware scanning, quarantine, emergency revocation, advisories, and last-known-good operation.
- Transparency records for publication, transfer, revocation, vulnerability, moderation, and appeal.
- Cross-registry source pinning and namespace authority to prevent dependency confusion.

## Moderation and Due Process

Moderation has published rules, severity levels, evidence retention, response targets, appeal, conflict-of-interest controls, and emergency procedures. Automated signals never become unsupported guarantees. Publishers can correct metadata, contest findings, transfer ownership, deprecate, or withdraw while security records remain auditable.

## Vulnerability Response

Coordinated disclosure supports embargoed reports, affected-version ranges, mitigations, patched releases, revocation when necessary, downstream notification, and advisory federation. Diagnostic evidence excludes secrets and source content.

## Privacy and Recommendations

No prompts, responses, credentials, source content, or behavioral profiles are required for ecosystem operation. Recommendation inputs are local and inspectable by default. Any managed analytics are explicit, minimal, revocable, and never used for surveillance advertising.

## Trust, Maturity, and Evidence Presentation

Trust state, maturity, support, compatibility, popularity, and policy approval are independent dimensions. The interface must not collapse them into a universal security, quality, or community score.

Evidence is presented as inspectable cards with issuer, scope, verification date, expiry, limitations, and revocation status:

- signature and provenance;
- compatibility freshness;
- maintenance and support;
- vulnerability and advisory status;
- evaluation coverage and limitations;
- publisher identity and namespace authority;
- community activity and version-scoped reviews.

`Official`, `verified`, `community`, `enterprise`, `private`, and similar labels identify source or governance context. `Experimental`, `preview`, `stable`, `enterprise-certified`, and `deprecated` identify maturity. Neither category grants runtime authority or proves safety for a specific project.

## Incident Response

Registry compromise, signing-key loss, malicious package, namespace dispute, and mass revocation each require a runbook, communication owner, containment, recovery, evidence preservation, and post-incident review. Offline clients receive signed revocation bundles without requiring accounts.

## Acceptance Gates

- Threat model, abuse-case tests, red-team exercises, and independent security review.
- Revocation propagation and last-known-good operation under registry outage.
- Publisher recovery and transfer exercises.
- Moderator appeal and emergency-action auditability.
- No critical/high unresolved finding and no unsupported security label.

## Capability Runtime Trust

Trust applies independently to package, capability, release, publisher, adapter, installation, activation, and invocation. A trusted package does not automatically make every bundled capability safe for every project or host.

Rules and guardrails are signed capabilities, but policy enforcement remains outside package authority. Deny overrides allow across constitution, organization, workspace, project, host, package, and session layers. Lower layers cannot broaden authority.

Agent teams and orchestration require explicit ownership, bounded delegation, memory isolation, data-flow propagation, deterministic operation IDs, budget enforcement, cancellation, audit, and final human authority. Unbounded loops, unrestricted lifecycle code, and silent host translation loss are prohibited.
