# Enterprise Capability System

> **Status:** Canonical architecture direction; documentation only.
>
> **Authority:** This document defines the provider- and host-neutral capability model used by Forgevena Core, ForgeRegistry, and ForgeHub. Runtime implementation requires an approved RFC, ADR, threat model, schemas, and change-readiness evidence.

## 1. Product Boundaries

Forgevena does not create a separate Capability Hub product.

| Boundary | Responsibility |
| --- | --- |
| **Forgevena Core** | Execute, govern, validate, observe, and roll back capabilities. |
| **ForgeRegistry** | Package contracts, manifests, deterministic resolution, trust, portability, mirroring, and offline distribution. |
| **ForgeHub** | Discovery, Capability Studio, publishing, installation, updates, collections, and ecosystem experience. |
| **Host Adapters** | Import, normalize, translate, install, verify, and remove capabilities for individual hosts. |

The canonical Forgevena package is authoritative. Claude, Cursor, Codex, OpenCode, Antigravity, Hermes, Gemini CLI, Windsurf, Cline, Aider, VS Code, JetBrains, desktop agents, cloud agents, and future systems are integration targets, not sources of the canonical data model.

## 2. Lifecycle Objects

The platform treats these as separate records with independent identifiers and evidence:

1. **Capability Definition:** immutable semantic behavior and contract.
2. **Capability Package:** signed distribution containing one or more definitions.
3. **Capability Release:** immutable version, hashes, provenance, compatibility, and evidence.
4. **Installation:** scope-specific managed package state.
5. **Configuration:** secret references, policy, bindings, and environment settings.
6. **Activation:** enabled capability with resolved dependencies and effective permissions.
7. **Invocation or Run:** bounded runtime execution with operation identity.
8. **Evidence Record:** validation, evaluation, audit, health, cost, and compatibility results.

A package may bundle several capabilities, but each capability retains an independent identity, version, maturity, permission declaration, compatibility result, and support lifecycle.

### Lifecycle Ownership Matrix

Lifecycle support is explicit per object. A package must not claim an operation that its type, host, or policy cannot safely support.

| Object | Required lifecycle | Conditional lifecycle |
| --- | --- | --- |
| Capability definition | Define, validate, version, evaluate, deprecate, retire | Fork, compose, translate |
| Capability package | Discover, inspect, resolve, verify, publish, withdraw, archive | Import, convert, mirror, export |
| Capability release | Sign, attest, distribute, revoke, supersede, retain | Rebuild, certify, restore |
| Installation | Plan, install, verify, inventory, update, roll back, remove | Adopt, migrate, repair, back up, restore |
| Configuration | Validate, bind secret references, apply policy, audit | Export, import, inherit, migrate |
| Activation | Authorize, enable, health-check, suspend, disable | Schedule, scope, fail over |
| Invocation or run | Admit, execute, observe, cancel, record evidence | Resume, replay, compensate, recover |
| Evidence record | Create, verify, expire, retain, export | Federate, appeal, supersede |

Discovery, import, conversion, publication, installation, activation, and execution are separate authorities. Presence in a registry never grants installation or runtime permission.

### Installation Scope and Deployment Mode

Installation scope and deployment mode are independent dimensions.

| Dimension | Values | Meaning |
| --- | --- | --- |
| Installation scope | Global, organization, workspace, project, shared, read-only | Where ownership, configuration, policy, and version selection apply. |
| Deployment mode | Local, private, offline, air-gapped, optional cloud | Where registry, execution, or management services operate. |

Narrower scopes may pin or restrict broader selections but cannot silently broaden permissions. Resolution records source, owner, selected version, inherited configuration, conflicts, policy decisions, and rollback target. A deployment mode cannot create a new precedence level or bypass consent, policy, or offline guarantees.

## 3. Layered Taxonomy

Families are stable. Types are namespaced and extensible so the resolver does not require a new core release for every domain.

| Family | First-class types |
| --- | --- |
| Intelligence and behavior | Agent, Agent Team, Subagent, Persona, Skill, Prompt, Prompt Template, Prompt Pack, Rule Set, Planner, Evaluator, Guardrail, Provider Adapter, Model Adapter |
| Actions and connectivity | Tool, Tool Pack, Command Pack, MCP Server, MCP Client Profile, Connector, Integration, API Package, Webhook, Event Source, Browser Adapter, Computer Adapter |
| Context and knowledge | Memory, Memory Adapter, Context Pack, Knowledge Pack, Knowledge Base, Dataset, Index, Retriever, Reranker, Embedding Adapter, Vector Store |
| Orchestration and automation | Workflow, Chain, DAG, Graph, State Machine, Bounded Loop, Pipeline, Router, Trigger, Hook, Scheduler, Automation, Playbook, Runbook, Agent-Team Topology |
| Experience and interfaces | AI Application, Dashboard, Widget, UI Component, Theme, IDE Extension, CLI Module, Desktop Adapter, Messaging or Channel Adapter |
| Delivery and development | Template, Blueprint, Project Generator, SDK, Runtime Module, Extension, Builder Profile, Deployment Pack, Organization Distribution |
| Governance and assurance | Policy Pack, Compliance Pack, Permission Profile, Evaluation Suite, Benchmark Pack, Observability Pack, Security Pack, Compatibility Pack |

Future types use namespaced identifiers such as `community.robotics/simulator`. Orthogonal facets describe execution mode, host support, data class, permissions, installation scope, runtime isolation, composability, maturity, support, and trust. A facet must not be duplicated as a capability type.

## 4. Rules and Policy Authority

Rule sets are installable capabilities. Enforcement remains a platform authority.

```text
Platform Constitution
→ Organization Policy
→ Workspace Policy
→ Project Policy
→ Host Policy
→ Package Permissions and Rules
→ Session Restrictions
```

- Deny overrides allow.
- A lower layer may restrict authority but cannot broaden it.
- Package rules cannot override organization, workspace, project, consent, security, privacy, billing, or publication policy.
- Rule packages declare scope, triggers, precedence intent, compatibility, tests, and evidence.
- Policy simulation must explain the effective decision and test alternate command paths for bypasses.

## 5. Contract Direction

The following future contracts require separate approval before implementation:

- `capability-manifest/v1`
- `capability-package/v1`
- `host-adapter/v1`
- `agent-definition/v1`
- `agent-team-definition/v1`
- `orchestration-definition/v1`
- `rule-set/v1`
- `evaluation-suite/v1`

Every package declares identity, entry points, exports, dependencies, peer requirements, conflicts, compatibility, permissions, secret references, data classifications, runtime requirements, lifecycle operations, UI surfaces, evaluation suites, observability, migrations, rollback, signatures, provenance, SBOM, license, support, and maturity.

Executable lifecycle scripts are prohibited unless they are sandboxed, permission-scoped, resource-bounded, policy-approved, auditable, and explicitly consented.

Unbounded autonomous loops are prohibited. Orchestration packages must use the bounded execution contract defined by the [Orchestration and Agent Runtime Strategy](ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md).

## 6. Capability Studio

ForgeHub provides one schema-driven Capability Studio rather than duplicated builders:

- Agent and Team Studio.
- Skill, Prompt, and Rule Studio.
- Workflow and Automation Studio.
- Knowledge, Context, and Memory Studio.
- Tool, MCP, Connector, and Integration Studio.
- UI, Dashboard, and Extension Studio.
- Template, Blueprint, and Project Studio.
- Package, Evaluation, and Publisher Studio.

Each profile provides a wizard, templates, schema validation, threat and permission review, testing, evaluation, simulation, documentation, packaging, signing, staged publishing, compatibility export, and rollback guidance. Commerce remains license-ready metadata only until separate evidence approves payment, tax, payout, entitlement, refund, and fraud systems.

AgentSpace is the agents-and-teams experience inside ForgeHub. It is not a registry, runtime, policy engine, or separate product authority. It presents agents, subagents, teams, profiles, collections, bundles, dependencies, releases, evaluations, documentation, compatibility, run evidence, and health by reusing ForgeRegistry packages and Forgevena Core execution controls.

## 7. Compatibility Research

Modern ecosystems demonstrate the need for bundled but independently governed components:

- [Claude plugins](https://github.com/anthropics/claude-plugins-official) combine manifests, MCP, commands, agents, and skills.
- [Cursor plugins](https://cursor.com/blog/marketplace) combine skills, subagents, MCP, hooks, and rules.
- [Antigravity](https://www.antigravity.google/docs/overview), [OpenCode](https://opencode.ai/docs/tools), and [Hermes](https://hermes-agent.noasresearch.com/docs/developer-guide/plugins) expose different combinations of tools, skills, agents, memory, hooks, providers, and host APIs.

These are research inputs, not support claims. A host becomes supported only after dated fixtures, translation evidence, smoke tests, and published limitations exist.

## 8. Acceptance Direction

Future implementation must prove:

- unique family and type identifiers with valid namespace ownership;
- package, capability, release, installation, configuration, activation, run, and evidence separation;
- complete permissions, secret references, and data-flow declarations;
- deny-overrides policy behavior across every command path;
- deterministic dependency and compatibility resolution;
- explicit translation loss reports and visible unsupported results;
- safe installation, activation, update, rollback, removal, and offline export;
- no unsupported maturity, security, certification, or host compatibility claims.
