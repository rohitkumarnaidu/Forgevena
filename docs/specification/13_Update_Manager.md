# Update Manager

> **Specification status:** Foundational contract; implementation is delivered incrementally through the versioned roadmap.
>
> **Canonical product strategy:** [Enterprise Update Management Strategy](../strategy/ENTERPRISE_UPDATE_MANAGEMENT.md)

The Update Manager coordinates trusted discovery, compatibility and policy resolution, preview, consent, acquisition, verification, migration, health checks, history, and recovery. It manages lifecycle operations for the Forgevena core and approved ecosystem components without becoming a second installer or persistence system.

## Responsibilities

- Read installed component inventory and installation-source metadata from governed state.
- Discover signed release and catalog metadata according to configured channel and check policy.
- Resolve operating-system, architecture, runtime, schema, dependency, capability, publisher, and organization-policy compatibility.
- Generate a preview containing affected scope, download size, migrations, external effects, health checks, and rollback limits.
- Delegate installation to the owning package manager or component lifecycle adapter.
- Verify hashes, signatures, provenance, SBOM references, and release metadata before use.
- Snapshot managed state, execute bounded migrations, validate health, and record metadata-only evidence.
- Restore the last known-good managed state when supported and report manual recovery when it is not.
- Support signed offline bundles and cached metadata verification without requiring a hosted account.

## Safety Boundaries

- Checks are read-only; downloads and installations are separate consent boundaries.
- Mutations require `--apply`; external effects require explicit consent.
- Existing project files are never overwritten or migrated automatically.
- The original installation channel is preserved.
- Untrusted, unsigned, revoked, expired, incompatible, or downgraded artifacts fail closed.
- Updates never silently activate providers, plugins, MCP servers, telemetry, or data egress.
- Credentials, prompts, responses, authorization headers, and source contents are excluded from update state and diagnostics.

## Architecture Reuse

The Update Manager uses the existing StateEngine, registry, consent, policy, diagnostics, component lifecycle, release, and managed-rollback contracts. It does not introduce a parallel database, event system, installer framework, or remote dependency.

## Versioning

Compatible state and component changes may ship in minor releases with tested migrations and rollback. Breaking changes require a major version, compatibility report, migration tooling, release notes, and a verified recovery path. Published versions and tags remain immutable.
