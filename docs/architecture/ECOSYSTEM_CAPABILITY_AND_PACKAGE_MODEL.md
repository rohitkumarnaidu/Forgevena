# Ecosystem Capability and Package Model

> **Status:** Candidate contract model; implementation requires schema RFC and ADR approval.

## Model

A Forge package is an immutable, signed unit containing one or more namespaced capabilities. A capability type describes semantics; the package transport only carries verified content.

Initial adapters cover providers, plugins, MCP servers, templates, skills, workflows, policy packs, compliance packs, CLI extensions, dashboard extensions, and organization distributions. New namespaced types can be introduced without modifying core resolution logic.

## Manifest Requirements

- Schema, package, capability, and publisher identifiers.
- Immutable version, content hashes, provenance, SBOM, license, and source.
- Dependencies, optional peers, conflicts, replacements, and compatibility constraints.
- Platform, architecture, runtime, Forgevena, host, and policy requirements.
- Declared permissions, data classes, external effects, and lifecycle operations.
- Documentation, support, maturity, deprecation, maintenance, and evidence dates.
- Signatures, trust chain, revocation references, and reproducibility metadata.

## Scope and Precedence

Supported scopes are global, organization, workspace, project, shared, and read-only. Scope precedence must be explicit, inspectable, policy-controlled, and recorded in lockfiles. A broader scope cannot silently replace a narrower pinned dependency.

These are installation scopes. Local, private, offline, air-gapped, and optional cloud are deployment modes, not additional scopes. Deployment mode changes transport and availability constraints but never changes package identity, ownership, precedence, consent, or policy authority.

Every resolved installation records the owning scope, inherited selections, explicit pins, configuration bindings, source registry, conflicts, override reason, and last-known-good rollback target. A broader scope cannot broaden permissions or replace project-owned configuration, and ambiguous precedence fails closed.

## Composition

Composition bundles declare dependencies and policy; they do not copy or mutate packages. Resolver output includes the complete dependency graph, selected sources, compatibility decisions, permissions, ownership, and rollback plan.

## Lifecycle

The concise lifecycle below is the consumer path. Portability separately covers detection, import, quarantine, normalization, compatibility analysis, conversion or manual adaptation, validation, export, migration, and recovery. Publication separately covers build, test, evaluation, documentation, packaging, signing, support, deprecation, archival, withdrawal, and retirement.

`search → inspect → plan → resolve → verify → approve → install → configure → validate → health → update → rollback → remove`

Every mutation is preview-first, uses managed ownership, and preserves user files. Arbitrary lifecycle scripts are prohibited unless executed in an approved sandbox with declared permissions, bounded resources, policy, and consent.

Backup and restore apply only to managed mutable state. Immutable releases are recovered by digest from a verified source or retained offline bundle. Sharing, cloning, and forking create new governed references or publisher identities; they never mutate the original release. Capability types declare which lifecycle operations they support instead of inheriting unsupported behavior from a universal checklist.

## Isolation and Compatibility

Packages use version isolation where host capabilities permit. Compatibility is evidence-dated and never inferred solely from semantic version ranges. Failed updates retain the prior package and configuration.

## Supply Chain

Package publication requires canonical manifests, deterministic archives, content hashes, signatures, provenance, SBOM, license evidence, vulnerability checks, and reproducible fixtures. Independent rebuild verification is a strategic goal.

## Acceptance Gates

- Canonical serialization produces stable hashes.
- Lockfiles reproduce the same graph across registries and offline bundles.
- Path escape, archive bomb, duplicate identity, cycle, conflict, and permission tests fail safely.
- Package removal affects only unchanged managed assets.
- Extensible capability types cannot bypass host policy or trust checks.

## Enterprise Capability Package Extension

The canonical taxonomy and lifecycle are defined by the [Enterprise Capability System](ENTERPRISE_CAPABILITY_SYSTEM.md). A package may contain several capability definitions, but packaging never collapses their independent identities. Every bundled capability declares its family, namespaced type, version, maturity, permissions, data classes, host compatibility, evaluation evidence, configuration schema, and support lifecycle.

The lifecycle separates definition, package, release, installation, configuration, activation, invocation, and evidence. Registry state must never treat installation as activation or package presence as runtime permission.

Future package contracts include `capability-manifest/v1`, `capability-package/v1`, `agent-definition/v1`, `agent-team-definition/v1`, `orchestration-definition/v1`, `rule-set/v1`, and `evaluation-suite/v1`. These are architecture targets only until approved schemas and threat models exist.

Host-native formats are imported and exported through the [Host Adapter and Portability Strategy](HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md). Every translation records loss as `native`, `exact`, `translated`, `degraded`, or `unsupported`; unsupported semantics fail visibly.
