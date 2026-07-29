# v1.5.0 — Isolated Plugin and MCP Ecosystem

> **Purpose:** Feature specification for MCP, Source, and Host Adapter Foundation.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Plugin and MCP Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#8-v150--isolated-plugin-and-mcp-ecosystem`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `mcp-source-host-adapters`
- **Classification:** committed
- **Owner:** Plugin and MCP Maintainers

## Purpose and Problem

Inspect external sources and translate supported capability bundles through explicit compatibility and loss reports.

## Business and Developer Value

Users can assess external capabilities without treating arbitrary packages as trusted Forgevena content.

## Architecture

Detect, acquire, quarantine, inspect, normalize, analyze, sandbox-test, package, sign, and install are separate governed stages.

## Dependencies

- isolated-plugin-runtime

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Loss and permission-delta reports are mandatory.
- Unsupported primitives fail visibly.
- Quarantine inspection performs no activation.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- Supply-chain malware.
- Silent semantic loss during translation.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
