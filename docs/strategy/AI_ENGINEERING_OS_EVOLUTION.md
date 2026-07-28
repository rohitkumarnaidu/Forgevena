# AI Engineering Operating System Evolution

> **Status:** Long-term strategic target for `v3.0`; not authorization to add a new runtime layer today.

## Definition

The AI Engineering Operating System is the integrated local-first experience formed by Forgevena Core, ForgeRegistry, ForgeHub, policy, workflows, evidence, engineering intelligence, organization governance, and optional managed services.

It is an engineering operating system in product scope—not a replacement kernel, cloud, IDE, source-control system, or human authority.

## Evolution

```text
Developer CLI
→ Local Developer Platform
→ Enterprise Engineering Platform
→ Optional Organization Control Plane
→ ForgeRegistry
→ ForgeHub
→ AI Engineering Operating System
→ Federated AI Engineering Ecosystem
```

## Unified Workspace Model

A workspace connects projects, architecture, dependencies, capabilities, policies, evidence, environments, owners, risks, releases, and support state. Raw source stays local by default. Metadata indexes are minimized, inspectable, exportable, and deletable.

## Strategic Capabilities

- **Project digital twin:** metadata-only architecture, ownership, dependency, environment, risk, and release model.
- **Trust and evidence graph:** requirements, ADRs, code, tests, policies, SBOMs, vulnerabilities, approvals, and releases.
- **Release autopilot:** readiness, evidence, migration, rollback rehearsal, and human-controlled promotion.
- **Resilience lab:** crash, corruption, outage, provider failure, and disaster-recovery exercises.
- **Engineering capsules:** signed reproducible offline bundles of tools, policies, configuration, docs, and evidence.
- **Governed cross-project workflows:** deterministic, resumable automation through existing policy, consent, provider, and plugin contracts.

## Human Authority

Recommendations are explainable and read-only by default. Generated mutations require an inspectable plan, policy approval, managed ownership, `--apply`, and explicit consent. Deployment, billing, publication, credential use, and destructive actions retain human authority.

## Optional Control Plane

Remote coordination distributes signed policy and catalogs, synchronizes approved metadata, manages fleets, and retains audit evidence. Local operation continues during outages and without an account. Tenant isolation, SSO, RBAC, encryption, conflict recovery, and self-hosting are prerequisites.

## Enterprise Capability Platform

The AI Engineering OS composes Forgevena Core, ForgeRegistry, ForgeHub, host adapters, policy, evidence, and bounded orchestration. It does not create a parallel capability store or host-specific source of truth.

Deterministic chains, DAGs, state machines, and bounded loops mature before dynamic teams. Dynamic graphs, recursive delegation, swarms, self-evolving agents, and cross-organization collaboration remain experimental until isolation, replay, policy, evaluation, deadlock and livelock detection, cost controls, and human promotion are proven.

The [Enterprise Capability System](../architecture/ENTERPRISE_CAPABILITY_SYSTEM.md) defines capability identity and packaging. The [Orchestration Strategy](../architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md) defines execution safety, and the [Host Adapter Strategy](../architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md) defines portability.

## GA Gates

Independent security review, migration rehearsals from the final 2.x release, federation resilience, local/offline completeness, accessibility, privacy validation, enterprise evidence, incident exercises, and ecosystem governance must pass before `v3.0` GA.
