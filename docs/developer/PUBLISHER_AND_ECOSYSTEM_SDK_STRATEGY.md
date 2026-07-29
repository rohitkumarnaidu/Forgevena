# Publisher and Ecosystem SDK Strategy

> **Status:** Strategic developer-experience target; no package publishing API is approved by this document.

## Publisher Lifecycle

`onboard → verify identity → claim namespace → develop → validate → test → sign → preview → submit → moderate → publish → support → update → deprecate → withdraw or transfer`

Each stage produces machine-readable evidence and preserves publisher recovery and appeal paths.

## SDK Surfaces

SDKs will cover package manifests, providers, plugins, MCP servers, templates, skills, workflows, policy/compliance packs, CLI extensions, dashboard extensions, and organization distributions. Language SDKs remain thin wrappers around versioned schemas and protocol fixtures.

Source-adapter and converter SDKs are distinct from host adapters. Source adapters acquire and identify external material; converters create canonical capability definitions with deterministic loss and permission-delta evidence; host adapters project canonical definitions into execution hosts. SDKs must not blur these authorities or imply that an acquired artifact is installable.

## Tooling

- Manifest scaffolding and schema-aware editing.
- Deterministic package assembly and content hashing.
- Local registry and resolver fixtures.
- Permission, policy, compatibility, migration, rollback, and offline tests.
- Signature, provenance, SBOM, license, and reproducibility verification.
- Sandbox and malicious-input harnesses.
- Documentation, accessibility, support, and deprecation checks.
- Staged publication to local, private, preview, and public channels.
- Source-detection fixtures, quarantine controls, conversion reports, manual-adaptation guidance, and deterministic exporter tests.

## Publisher Responsibilities

Publishers declare ownership, support, licensing, permissions, data handling, compatibility, maturity, vulnerabilities, and maintenance status. They protect signing keys, respond to incidents, publish deprecations, and maintain recovery contacts.

## Platform Responsibilities

The platform provides deterministic contracts, validation, fair moderation, transparent ranking, appeals, revocation, advisories, compatibility evidence, ownership transfer, succession, and export. It does not promise security solely because a package is listed.

## Certification

Compatibility and enterprise certification are evidence-backed, scoped, dated, renewable, appealable, and revocable. Certified packages must pass reproducible fixtures and current supported-platform tests.

## Acceptance Gates

- An independent publisher can create and verify a package from public specifications.
- Malformed, malicious, unsigned, incompatible, and over-privileged packages fail safely.
- Ownership recovery, transfer, deprecation, withdrawal, and vulnerability response are tested.
- SDK and protocol versions have explicit compatibility and migration policies.

## Enterprise Capability SDK Direction

Publisher contracts follow the [Enterprise Capability System](../architecture/ENTERPRISE_CAPABILITY_SYSTEM.md), [Host Adapter Strategy](../architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md), and [Orchestration Strategy](../architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md).

The SDK validates package/capability separation, namespaced taxonomy, facets, permissions, data flows, secret references, maturity, evidence, and lifecycle behavior. Contract fixtures for capability packages, host adapters, agents, teams, orchestration, rules, and evaluation suites require individual RFC approval.

Exporter tooling produces deterministic output and a machine-readable loss report. Agent and workflow tooling rejects unbounded loops, undeclared shared memory, unrestricted delegation, missing budgets, and external effects without consent or compensation plans.

The schema-driven Capability Studio is the shared builder surface. Specialized profiles may customize forms, examples, evaluation suites, and documentation, but they reuse the same identity, permissions, policy, packaging, signing, publication, and rollback contracts.
