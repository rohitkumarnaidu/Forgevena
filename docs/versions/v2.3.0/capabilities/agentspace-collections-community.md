# v2.3.0 — ForgeHub Discovery and Lifecycle

> **Purpose:** Feature specification for AgentSpace, Collections, and Community.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** ForgeHub Product Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#v230--forgehub-discovery-and-lifecycle`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `agentspace-collections-community`
- **Classification:** committed
- **Owner:** ForgeHub Product Maintainers

## Purpose and Problem

Organize agents, teams, profiles, bundles, evaluations, reviews, collections, and publisher responses inside ForgeHub.

## Business and Developer Value

Users can discover and govern complex AI capabilities without creating a separate authority layer.

## Architecture

AgentSpace presents registry definitions and Core execution evidence; community content is moderated and version-scoped.

## Dependencies

- forgehub-lifecycle-experience

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- AgentSpace remains inside ForgeHub.
- Trust and maturity are distinct.
- Moderation, appeals, abuse, and accessibility flows pass.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Social signals may be mistaken for trust.
- Moderation burden and abuse.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
