# v3.0.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Major-version breaks:** only contracts that cannot preserve security, deterministic package identity, tenant isolation, policy semantics, or migration safety may break. Every break requires a compatibility report, machine-readable migration, preview, backup, rollback or supported roll-forward, deprecation history, and support for the final 2.x release.
- **Federated governance:** the ecosystem uses a published constitution, protocol stewardship group, security response team, independent appeals, transparent RFC and decision records, conflict-of-interest policy, maintainer succession, and neutral registry rules. No managed service controls the open protocol or local client.

## Unified Authority Model

Forgevena Core remains the only runtime authority for state, vault, policy, consent, audit, and rollback. ForgeRegistry remains package and trust authority. ForgeHub remains discovery, publishing, lifecycle, AgentSpace, and Capability Studio experience. The optional control plane distributes organization policy and fleet state. Host and source adapters translate without becoming canonical authorities.

## Evidence Graph and Digital Twin

The evidence graph links requirements, decisions, packages, code identities, tests, policies, releases, SBOMs, vulnerabilities, approvals, compatibility, and operations using immutable typed references. The project digital twin stores metadata-only architecture, dependencies, ownership, environments, risks, and release state. Source content remains local unless separately approved.

Release Autopilot produces readiness assessments, plans, evidence gaps, and rollback rehearsals but cannot promote releases. Engineering Capsules export signed reproducible offline bundles containing configuration, policy, packages, docs, and verification evidence. Resilience Lab runs bounded crash, corruption, outage, rollback, and recovery exercises.

## Governed Agent Orchestration

Agent teams declare roles, topology, authority, shared-memory boundaries, delegation depth, concurrency, budgets, conflict resolution, evaluation, and final human control. Graphs and loops are typed, bounded, cancellable, replayable, policy-controlled, and protected against deadlock, livelock, recursive delegation, runaway cost, and unauthorized mutation.

## Migration, Operations, and GA

Migration from 2.x resolves package and policy contracts, previews every transformation, preserves exports and rollback, and supports offline conversion. Control-plane outages preserve local operation. Federation conflicts are deterministic and recoverable. GA requires independent security review, tenant-isolation evidence, migration rehearsals, ecosystem governance approval, current compatibility evidence, disaster-recovery exercises, and complete local/offline function.

Tests cover every authority boundary, cross-tenant and cross-registry attack, evidence forgery, agent escalation, unbounded execution, conflict recovery, offline capsules, 2.x migration, rollback, and managed-service outage. `v3.0.0` is done only when all predecessor contracts are approved and the full platform passes enterprise release gates without unsupported certification claims.

## Scope, Ownership, Inputs, and Outputs

Every policy, package, workflow, agent, evidence, synchronization, resilience, and release event carries its authority source, schema version, and operation ID.

Forgevena Architecture and Ecosystem Maintainers own `unified-ai-engineering-os` and `evidence-digital-twin-autopilot`. Inputs are governed Core state, Registry packages, ForgeHub metadata, organization policy, signed workflows, project digital-twin metadata, evidence graph records, agent-team definitions, budgets, and human decisions. Outputs are unified plans, bounded runs, evidence-linked recommendations, engineering capsules, resilience exercises, release-readiness assessments, and auditable cross-system state. Authority remains separated among Core execution, Registry truth, ForgeHub experience, organization policy, and optional managed services.

## Security, Permissions, and Data Flow

Permissions propagate through every graph edge and can only narrow. Data flow is typed, classified, residency-bound, retention-bound, and excluded from managed services unless explicitly authorized. Agent teams receive scoped capabilities, memory, delegation depth, concurrency, token, cost, and time budgets. Human approval is mandatory before mutation, deployment, publication, billing, credential use, cross-project sharing, trust changes, or release promotion. Local and air-gapped operation remains complete without telemetry or an account.

## Failure, Recovery, Migration, and Rollback

Failure is isolated to the smallest capability, workflow, registry, or tenant boundary and cannot silently broaden authority. Recovery uses durable checkpoints, immutable evidence, verified packages, and last-known-good policy. Migration from 2.x previews every contract and data transformation, preserves export and backup, and supports offline rollback. Rollback restores compatible Core, Registry, Hub, policy, workflow, and evidence graph versions; roll-forward resolves immutable successor records. Kill switches stop agent execution, remote sync, publication, deployment, or autopilot promotion independently.

## Service Objectives and Capacity

Local read-only commands have a service level objective of p95 below 250 ms, ordinary evidence graph queries below 500 ms for 1,000,000 edges, and policy decisions below 100 ms for 10,000 rules. Long-running orchestration supports 1,000 nodes, 32 concurrent workers, 24-hour default duration, and explicit token and cost budgets. Control-plane availability targets 99.9%, RPO 15 minutes, and RTO 4 hours without weakening local continuity. Health reports authority, policy, registry, workflow, evidence, agent, synchronization, and rollback status.

## Verification and Acceptance Evidence

Tests include unit tests, contract tests, integration tests, end-to-end tests, negative tests, adversarial tests, performance tests, migration tests, rollback tests, and recovery tests. Fixtures cover cross-tenant and cross-registry attacks, forged evidence, agent escalation, recursive delegation, deadlock, livelock, runaway cost, provider outage, control-plane outage, capsule tampering, conflict recovery, offline use, 2.x migration, and full rollback. Acceptance evidence includes independent security review, predecessor approvals, migration rehearsals, tenant-isolation proof, federation resilience, reproducible capsules, bounded-agent traces, disaster-recovery exercises, accessibility review, and offline continuity. The evidence owner is Forgevena Architecture and Ecosystem Maintainers; GA, security, migration, trust, and release evidence retention is permanent.

## AI-Agent Implementation Rules

An AI coding agent must treat the Constitution, approved contracts, policy decisions, and signed evidence as authority in that order. It must not infer permissions, graph edges, trust, compatibility, tenant scope, data movement, budget, or release approval. Missing or contradictory authority, expired evidence, unknown effects, or exceeded limits must fail closed. The agent may create read-only plans and evidence-linked recommendations, but every external effect and promotion requires human approval.
