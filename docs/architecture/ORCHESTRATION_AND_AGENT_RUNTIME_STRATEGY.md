# Orchestration and Agent Runtime Strategy

> **Status:** Architecture direction and safety contract; no runtime authorization.

## 1. Deterministic Foundation

Forgevena introduces orchestration in increasing order of operational risk:

1. Sequential chains.
2. Directed acyclic graphs.
3. Conditional routing.
4. State machines.
5. Fan-out, fan-in, and map-reduce.
6. Bounded retry and refinement loops.
7. Scheduled and event-triggered automation.
8. Human approval checkpoints.
9. Compensating actions and rollback.
10. Resumable long-running operations.

Every node has typed inputs, outputs, state, events, and errors; a deterministic identifier and version; an idempotency declaration; and an external-effect classification.

## 2. Bounded Execution

Every loop and recursive path must declare:

- maximum iterations and delegation depth;
- maximum wall-clock duration;
- token and monetary cost budgets;
- concurrency and resource limits;
- success and termination conditions;
- timeout, cancellation, retry, and failure policy;
- checkpoint, compensation, and recovery behavior.

Unbounded autonomous loops are prohibited. Cycle, recursion, deadlock, livelock, duplicate external effect, and runaway-cost detection must fail safely and produce auditable evidence.

## 3. Agent Patterns

The following are evidence-gated patterns, not automatic stable features:

- planner–executor;
- supervisor–worker;
- typed agent teams;
- critic–refiner;
- debate and consensus;
- router and specialist agents;
- hierarchical teams;
- parallel swarm execution;
- blackboard or shared-task coordination;
- human-agent collaboration;
- self-healing and recovery agents.

An agent team defines accountable ownership, role contracts, communication topology, approved shared-memory boundaries, conflict resolution, delegation depth, concurrency, authority, budgets, escalation, and final human promotion control.

Dynamic graphs, recursive delegation, swarms, cross-organization collaboration, self-evolution, and autonomous optimization remain experimental opportunities until isolation, policy, evaluation, deterministic replay, deadlock and livelock handling, and cost controls are independently proven.

## 4. Runtime Safety Contract

Every orchestration definition must declare:

- permission and data-class propagation across nodes;
- memory isolation and explicitly approved shared context;
- secret references without raw secret distribution;
- retries, deadlines, cancellation, compensation, and checkpoints;
- deterministic replay boundaries and non-replayable external effects;
- trace, audit, evaluation, health, and cost evidence;
- human consent before mutation, credential use, deployment, publication, billing, or irreversible external effects.

Provider, plugin, MCP, policy, state, audit, consent, and rollback services remain the authorities. The workflow engine cannot create parallel security or credential infrastructure.

### Human Authority

Human owners retain final promotion authority. No agent, team, graph, scheduler, or recovery routine may independently approve project mutation, credential use, deployment, publication, billing, policy promotion, or release.

## 5. Maturity Sequence

- **`v1.9`:** signed prompts, skills, rule sets, chains, DAGs, state machines, bounded loops, and resumable deterministic workflows.
- **`v1.10`:** read-only agent/team plans, evaluations, and orchestration recommendations.
- **`v3.0`:** governed dynamic teams and advanced graph orchestration only after ecosystem, policy, evaluation, and compatibility gates pass.

No documentation milestone alone authorizes runtime implementation. Each stage requires an RFC, ADR, threat model, schemas, fixtures, migration and rollback plans, and a passing readiness scorecard.
