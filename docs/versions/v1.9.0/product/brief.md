# v1.9.0 — Signed Skills and Deterministic Workflows

> **Purpose:** Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.
> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents
> **Owner:** Workflow and Engineering Assets Maintainers
> **Roadmap authority:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md#12-v190--signed-skills-and-deterministic-workflows`
> **Lifecycle:** planned
> **Review:** before implementation and at every lifecycle promotion

## Problem and Business Value

Deliver signed engineering assets and resumable, bounded, deterministic workflow execution.

This version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.

## Personas and Journeys

- **Individual developer:** previews, validates, and adopts the capability locally.
- **Platform engineer:** configures policy, compatibility, and operational boundaries.
- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.
- **Maintainer:** publishes, supports, migrates, and retires the capability safely.

The primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.

## Scope

- **Signed Skills, Prompts, and Rules:** Register versioned skills, prompts, packs, and rules with provenance, variables, compatibility, licensing, policy, and signatures.
- **Deterministic Workflow Engine:** Execute explicit chains, DAGs, state machines, bounded loops, and human checkpoints with resumable state.

## Candidates

- None approved.

## Non-Goals

- No unbounded autonomous loops or unrestricted recursive delegation.
- No workflow may bypass existing provider, plugin, policy, consent, or rollback services.

## Success Metrics

- Workflow order and replay are deterministic.
- Interrupted runs resume without repeating completed external effects.
- Skill and workflow signatures fail closed.
