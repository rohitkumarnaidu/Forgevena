# v1.9.0 — Signed Skills and Deterministic Workflows

> **Purpose:** Defines operational readiness, SLOs, observability, support, continuity, and retirement.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Workflow and Engineering Assets Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#12-v190--signed-skills-and-deterministic-workflows`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## SLOs and Error Budgets

Before preview, owners define availability, latency, correctness, recovery, compatibility-freshness, and support-response objectives with measurable error budgets.

## Observability

Metrics and traces are metadata-only, bounded, local by default, and correlated by operation ID. Health reports distinguish configuration, dependency, policy, compatibility, and external-service failures.

## Resilience and Recovery

Required exercises cover crash recovery, corruption, dependency outage, provider failure, network isolation, disk-full, permission denial, backup restore, rollback, and disaster recovery.

## Support and Sustainability

Document ownership, escalation, incident response, LTS policy, deprecation, end of support, decommissioning, maintainer succession, bus factor, capacity, operating cost, and legal obligations before stable release.
