# v2.2.0 — ForgeRegistry Federation and Enterprise Registries

> **Purpose:** Feature specification for Air-Gap, Revocation, and Continuity.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeRegistry Federation Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v220--forgeregistry-federation-and-enterprise-registries`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `airgap-revocation-continuity`
- **Classification:** committed
- **Owner:** ForgeRegistry Federation Maintainers

## Purpose and Problem

Export signed offline bundles, propagate revocations, quarantine risk, and preserve last-known-good operation.

## Business and Developer Value

Regulated and disconnected environments can promote packages safely.

## Architecture

Bundles carry packages, policies, trust roots, revocations, lockfiles, and verification evidence across controlled zones.

## Dependencies

- federated-registry-sources

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Offline promotion verifies without network.
- Revoked packages are quarantined predictably.
- Continuity and recovery drills pass.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Delayed revocation in disconnected sites.
- Emergency action may disrupt critical workloads.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
