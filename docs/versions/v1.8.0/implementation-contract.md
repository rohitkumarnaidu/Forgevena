# v1.8.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Trace contract:** stable traces use a Forgevena envelope aligned with OpenTelemetry concepts: trace ID, span ID, parent ID, operation ID, component, event name, monotonic timing, outcome, and approved attributes. Export formats remain adapters; vendor-specific fields are not stable contracts.
- **Retention:** local operational logs default to 14 days, metrics to 30 days, traces to 7 days, crash metadata to 30 days, and immutable audit evidence to the policy-defined period. Restricted content, prompts, responses, secrets, tokens, passphrases, and encrypted credential metadata are never retained. Users can shorten retention or disable nonessential diagnostics.

## Observability and Diagnostics

`TelemetryService` owns structured logs, metrics, and spans; `DiagnosticBundleService` owns redacted export; `AuditExporter` owns checksum-linked immutable records; `PerformanceProfiler` owns opt-in local profiles. All collectors use a recursive denylist plus typed allowlists. Diagnostic generation previews included categories, size, retention, and destination.

Health is reported per subsystem as `healthy`, `degraded`, `unavailable`, or `unknown`, with evidence timestamp and non-secret remediation. Crash reports include build, platform, operation metadata, normalized stack identifiers, and redacted component state; source content is excluded.

## Supply Chain and Release Gates

Each release produces CycloneDX and SPDX SBOMs, checksums, signed artifacts, provenance, dependency attestations, license inventory, threat-model status, and security checklist. Release blocks on unresolved critical/high findings, secret detection, dependency-policy failure, missing provenance, hash disagreement, documentation drift, or unsupported compatibility claims.

## Documentation and Dashboard

CLI, configuration, schema, provider, plugin, template, policy, skill, and workflow references are generated from source metadata and verified for drift. Historical records remain immutable. Dashboard assets use a restrictive CSP, no third-party trackers, keyboard-complete navigation, WCAG 2.2 AA targets, reduced-motion support, accessible charts, and tested empty/error/degraded states.

## Verification and Operations

Tests include recursive redaction, malicious keys, nested arrays, retention expiry, clock skew, corrupt audit chains, crash handling, unavailable exporters, SBOM reproducibility, provenance verification, CSP, accessibility, and documentation drift. Diagnostics must contain zero restricted values. Performance regressions over 20% block release. `v1.8.0` is done when evidence is reproducible, documentation has zero generated drift, diagnostic privacy tests pass, and release verification reproduces artifact hashes.

## Scope, Ownership, Inputs, and Outputs

Operations, Security, and Documentation Maintainers own `safe-local-observability` and `supply-chain-documentation-evidence`. Inputs are typed audit events, local health samples, build metadata, dependency graphs, source documentation metadata, retention policy, and explicit diagnostic requests. Outputs are redacted JSON logs, bounded local metrics, trace summaries, checksummed diagnostic bundles, SBOMs, provenance statements, generated references, and immutable evidence manifests. The lifecycle state is `planned`, `collecting`, `sealed`, `verified`, `expired`, or `deleted`; every state event carries an operation ID and schema version. No output is authoritative unless its evidence owner, generation tool version, inputs, and content hash are recorded.

## Security, Permissions, and Data Flow

Collection is deny-by-default for prompts, responses, credentials, tokens, passphrases, source bodies, encrypted vault metadata, and authorization headers. Permission to inspect metadata does not grant permission to inspect content. Data flow remains local unless a user previews the exact export fields and grants human approval. Retention defaults to 30 days for diagnostics and 365 days for release evidence; organization policy may shorten either period. Deletion removes retained local diagnostics and records a metadata-only tombstone. Residency follows the workspace policy, and exporters must not infer a remote destination. Every diagnostic bundle receives recursive redaction, archive-path validation, size limits, and a post-build secret scan.

## Failure, Recovery, Migration, and Rollback

A collection failure leaves no partially trusted bundle: temporary output is quarantined and excluded from indexes. Recovery rebuilds from immutable source evidence or reports the missing source; it never invents telemetry. Migration validates every prior schema before conversion and preserves the original archive. Rollback restores the previous generator and manifest version, while roll-forward regenerates evidence with the corrected tool and links both attempts. Corrupt audit chains fail closed, unavailable exporters degrade to local-only reporting, and kill switches disable crash collection, profiling, or external export independently.

## Service Objectives and Capacity

Local health reads have a service level objective of p95 below 100 ms for 10,000 indexed events. A standard diagnostic bundle completes within 30 seconds, stays below 100 MiB unless policy explicitly permits more, and consumes no network by default. Release evidence reproduction must match 100% of declared hashes. Redaction has a cost budget of 5 seconds per 100 MiB input and a health status of `healthy`, `degraded`, or `blocked`. Any performance regression above 20% or any restricted-value disclosure blocks release.

## Verification and Acceptance Evidence

The required matrix includes unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover nested secrets, malformed archives, clock skew, retention expiry, inaccessible paths, exporter outage, CSP violations, keyboard and screen-reader flows, and reproducible SBOM generation. Acceptance evidence includes test reports, redaction corpus results, artifact hashes, accessibility results, provenance verification, and documentation-drift output. The evidence owner is Operations, Security, and Documentation Maintainers; release evidence retention is permanent and non-release diagnostic evidence retention is policy-bound.

## AI-Agent Implementation Rules

An AI coding agent must implement only the named schemas, fields, retention rules, and exporters. It must not infer permission to collect content, enable telemetry, transmit data, weaken CSP, or mark evidence verified. Missing classification, residency, consent, or provenance information must fail closed. The agent must surface unknowns, preserve historical evidence, require human approval before any external export, and keep generated user-project behavior additive-only.
