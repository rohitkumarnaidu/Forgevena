# v1.5.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Isolation:** process isolation is mandatory on every host. Windows uses Job Objects and restricted process tokens where available; Linux uses process groups, resource limits, and optional namespace/seccomp controls; macOS uses process groups and sandbox profiles where available. Missing enhanced controls produce `degraded-isolation`; Tier-3 or organization policy may require them and fail closed.
- **Host translation:** translation is `exact` only when semantics, permissions, lifecycle, data handling, cancellation, errors, and rollback are preserved. Otherwise it is `translated`, `degraded`, `manual-adaptation`, or `unsupported`, with a loss report.

## Runtime and Protocol

`PluginSupervisor` owns worker lifecycle; `PermissionBroker` mediates filesystem, network, provider, process, and secret-reference operations; `RpcTransport` owns framed JSON-RPC; `PluginRegistry` owns manifests and trust; `McpCoordinator` owns MCP profiles and health. Workers never receive raw vault contents.

Lifecycle states are `installed`, `verified`, `disabled`, `starting`, `running`, `degraded`, `stopping`, `stopped`, `failed`, `quarantined`, `updating`, and `rolling-back`. JSON-RPC messages carry protocol version, operation ID, deadline, method, validated parameters, and bounded result. Unknown methods, malformed frames, late responses, duplicate IDs, oversized output, and protocol violations terminate or quarantine the worker according to severity.

## Trust and Permissions

Manifests declare immutable package hash, publisher, signature, platform range, entrypoint, dependencies, conflicts, permissions, resource limits, output limits, timeouts, health method, and rollback metadata. Unsigned packages remain disabled unless explicit policy approval records scope and expiry. Permission defaults deny. Path access uses canonical paths and workspace boundaries; network access uses approved hosts and protocols; provider access uses scoped host operations.

MCP profiles declare transport, authentication reference, capabilities, data classification, allowed roots, timeout, consent requirement, and health behavior. Remote activation requires preview, trust validation, policy, and consent.

## Dependency and Failure Behavior

Resolution is deterministic, rejects cycles, pins exact selected versions, and reports unsatisfied peers and conflicts. Startup is topological. A worker crash cannot terminate the host; restart is bounded to three attempts and disabled for deterministic protocol or permission violations. Stop sends graceful cancellation, waits the declared grace period, then terminates the process tree. Update snapshots prior state and rolls back to the last verified package on health failure.

## Interfaces and SDK

Commands cover install, verify, trust, enable, start, run, stop, reload, permissions, dependencies, health, update, rollback, disable, and remove. Every mutation previews manifest, publisher, signature, permissions, affected paths, processes, network scope, dependencies, and rollback limits. The SDK supplies typed RPC, cancellation, bounded logging, host-operation clients, manifest validation, fixtures, and a local signing workflow.

## Verification and Operations

Tests cover malformed RPC, hangs, crashes, forked children, excessive output, privilege denial, path traversal, network denial, dependency cycles, signature failures, update interruption, and rollback. Reference limits default to one worker CPU, 512 MiB memory, 10 MiB output per invocation, and configurable deadlines; stricter policy wins. Audit events contain metadata only. `v1.5.0` is done when supported OS isolation evidence, protocol conformance, permission bypass tests, MCP health, and rollback rehearsals pass.

## Scope, Ownership, Inputs, and Outputs

Plugin and MCP Maintainers own `isolated-plugin-runtime` and `mcp-source-host-adapters`. Inputs are signed manifests, resolved dependencies, permission grants, scoped host requests, MCP profiles, and cancellation signals. Outputs are bounded JSON-RPC results, health, loss reports, audit metadata, and stable failures. Worker state and event changes are controlled only by `PluginSupervisor`; plugins cannot mutate host lifecycle state directly.

## Security, Permissions, and Data Flow

Permission enforcement applies to every filesystem, network, provider, process, and secret-reference operation. The data flow is package quarantine, manifest verification, policy evaluation, worker start, brokered operation, validated output, and metadata-only audit. Raw credentials have zero retention in worker memory beyond the brokered operation and never enter RPC payloads. Human approval is required for unsigned trust exceptions, new permissions, remote MCP activation, executable updates, and destructive recovery.

## Failure, Recovery, Migration, and Rollback

Failure handling distinguishes transport, protocol, permission, dependency, resource, health, and worker failures. Recovery terminates the entire process tree, records the last valid checkpoint, and permits bounded restart only for retryable failures. Migration validates manifest and protocol versions before activation. Rollback restores the last verified package and permissions snapshot; roll-forward requires a new immutable package release.

## Service Objectives and Capacity

The service level objective is worker startup below 1 second p95 for 100 local starts and graceful cancellation acknowledgement within 2 seconds. Default capacity is 32 concurrent workers per workspace, 512 MiB per worker, and 10 MiB output per invocation unless stricter policy applies. The cost budget limits provider and network operations per invocation. Health separates supervisor, worker, dependency, permission, and MCP transport status.

## Verification and Acceptance Evidence

Required coverage includes unit tests, JSON-RPC contract tests, supervisor integration tests, CLI end-to-end tests, negative malformed-message tests, adversarial privilege and path tests, performance tests, update and migration tests, rollback tests, and a recovery test for orphaned child processes. Acceptance evidence includes sandbox capability, OS build, resource-limit enforcement, fixture hashes, kill results, and known degradation. The evidence owner is Plugin and MCP Maintainers, with retention through the supported plugin protocol window.

## AI-Agent Implementation Rules

An AI coding agent must use the brokered host API and must not infer undeclared permissions, host capabilities, or translation equivalence. It must fail closed on malformed manifests, unknown RPC methods, ambiguous paths, missing isolation, or incomplete loss reports. Human approval remains required for trust exceptions, permission expansion, remote activation, and release promotion.
