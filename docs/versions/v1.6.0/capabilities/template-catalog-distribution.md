# v1.6.0 — Template Packages and Native Distribution

> **Purpose:** Feature specification for Catalog and Native Distribution.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Template and Distribution Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#9-v160--template-packages-and-native-distribution`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Identity

- **Feature ID:** `template-catalog-distribution`
- **Classification:** committed
- **Owner:** Template and Distribution Maintainers

## Purpose and Problem

Support signed local and consent-gated HTTPS catalogs plus verified Homebrew, Winget, and Chocolatey outputs.

## Business and Developer Value

Organizations can distribute approved templates and users can install Forgevena through native channels.

## Architecture

Catalog resolution and native distribution generation share immutable release metadata and checksums.

## Dependencies

- versioned-template-packages

## Configuration and User Flow

Configuration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.

## CLI, Dashboard, and API Flow

CLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.

## Security, Privacy, and Reliability

Permissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.

## Testing and Acceptance

- Offline cache verification passes.
- Native manifests install, verify, and uninstall.
- Distribution metadata matches the release tag.

## Performance Targets

The feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.

## Migration and Documentation

Migration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.

## Risks

- External channel policy changes.
- Mirror or cache staleness.

## Future Expansion

Expansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.
