# v1.5.0 Implementation Readiness Audit

> **Audit ID:** `version-readiness-audit-v1.5.0-2026-07-30`  
> **Audit date:** 2026-07-30  
> **Type:** Prospective documentation-only implementation-readiness audit  
> **Verdict:** **HOLD**

## Executive Verdict

A new team or AI agent cannot safely implement v1.5.0 from the package. The package implies conversion, packaging, signing, and installation for external material while the canonical roadmap explicitly limits v1.5 to read-only detection and quarantined acquisition planning. Security-critical sandbox, permission, trust, and lifecycle decisions are also unresolved.

- **Overall score:** 43/100
- **Implementation readiness:** Not implementation-ready. Isolation, trust, lifecycle, RPC, MCP, and adapter boundaries remain incomplete or contradictory.
- **Owned blocking findings:** 11
- **Inherited dependency blockers:** 1
- **Re-audit required:** Yes

## Scores

| Domain | Score |
| --- | ---: |
| Product | 61 |
| Architecture | 44 |
| Engineering | 32 |
| Documentation | 50 |
| Security | 39 |
| Testing | 41 |
| Release | 48 |
| Enterprise Readiness | 35 |
| Open Source Readiness | 56 |
| Ai Agent Readiness | 27 |
| Maintainability | 43 |
| Extensibility | 46 |

## Mandatory Blockers

- **V15-B01:** Version package scope contradicts the canonical roadmap for conversion and installation. (`docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md`)
- **V15-B02:** Required OS sandbox controls beyond process isolation are unresolved. (`docs/versions/v1.5.0/decisions/index.md`)
- **V15-B03:** Exact versus degraded host translation criteria are unresolved. (`docs/versions/v1.5.0/decisions/index.md`)
- **V15-B04:** JSON-RPC, permission, trust, and lifecycle contracts are not decision-complete. (`docs/versions/v1.5.0/interfaces/contracts.md`)

## Inherited Dependency Blockers

- **v1.4.0:** v1.4.0 remains HOLD and must be independently approved before this version can advance. ([audit](../version-readiness-audit-v1.4.0/audit.md))

Inherited blockers do not duplicate version-owned findings. They preserve dependency order and close only when the predecessor receives an independent `APPROVE` verdict.

## Findings

| ID | Severity | Category | Blocking | Unanswered implementation question |
| --- | --- | --- | --- | --- |
| `V15-F01` | critical | roadmap-authority | Yes | Does v1.5 stop after read-only detection and quarantined acquisition planning, or may it convert, package, sign, and install external material? |
| `V15-F02` | critical | sandbox-security | Yes | Which OS-level sandbox controls are mandatory beyond a separate process and Node permission flags on Windows, macOS, and Linux? |
| `V15-F03` | critical | rpc-contract | Yes | What handshake, framing, method, event, cancellation, progress, error, capability negotiation, lifecycle, and compatibility messages form plugin RPC v1? |
| `V15-F04` | critical | permissions | Yes | What permission identifiers, scopes, resource selectors, policy precedence, upgrade diffs, runtime checks, revocations, and audit events are required? |
| `V15-F05` | critical | trust-and-signing | Yes | Which signature formats, trust roots, publisher identities, integrity fields, revocation sources, offline verification, and exception approvals are authoritative? |
| `V15-F06` | critical | lifecycle-and-state | Yes | What states and transitions govern install, verify, trust, enable, start, run, stop, reload, health, update, rollback, remove, crash, quarantine, and recovery? |
| `V15-F07` | critical | portability | Yes | Which host primitives may be classified native, exact, translated, degraded, manual-adaptation, or unsupported? |
| `V15-F08` | high | mcp-contract | Yes | Which MCP transports, protocol versions, authentication references, capability filters, timeouts, roots, prompts, tools, resources, sampling, and health semantics are supported? |
| `V15-F09` | high | dependency-resolution | Yes | How are dependency ranges, peer requirements, conflicts, cycles, platform constraints, lock state, updates, and rollback resolved? |
| `V15-F10` | high | testing | Yes | What malicious fixtures, resource ceilings, timing bounds, OS/runtime matrix, MCP servers, host adapters, and pass criteria certify isolation? |
| `V15-F11` | high | migration-and-compatibility | Yes | How do existing declarative and one-shot plugins coexist with runtime plugins, and how are manifests, trust, state, and rollback migrated? |
| `V15-F12` | medium | sdk-and-developer-experience | No | What SDK API, project layout, signing flow, local harness, examples, diagnostics, support policy, and compatibility guarantees are required? |

## Feature Traceability

| Feature | Status | Missing implementation contract |
| --- | --- | --- |
| `isolated-plugin-runtime` | partial | sandbox ADR; RPC schema; permission model; trust model; lifecycle state machine; dependency policy; migration plan; adversarial test matrix |
| `mcp-source-host-adapters` | contradictory | roadmap scope conflict; MCP policy contract; host compatibility criteria; loss report schema; source quarantine contract; deferred conversion boundary |

## Role-Specific Unanswered Questions

### Product

- Is source conversion and installation in v1.5 scope or explicitly deferred to v2.1?

### Architecture

- What are the authoritative RPC, lifecycle, dependency, and host-broker state machines?

### Engineering

- Which exact manifest fields, methods, messages, permissions, and transitions must be implemented?

### QA

- Which adversarial fixtures and resource thresholds prove that a plugin cannot corrupt the host?

### Security

- What OS sandbox and trust-root controls fail closed on every supported platform?

### DevOps

- How are cross-platform plugin and MCP conformance tests isolated and resource-bounded in CI?

### Documentation

- What complete author, administrator, and recovery journeys must be documented?

### Support

- Who owns plugin incidents, revocations, abandoned packages, and last-known-good recovery?

### AI coding agent

- Which roadmap authority should be followed when generated package scope contradicts the canonical roadmap?

## AI-Agent Verdict

- **Engineering Team:** NO
- **Codex:** NO
- **Claude Code:** NO
- **Cursor:** NO
- **Gemini Cli:** NO
- **Future Ai Systems:** NO

No listed agent or new engineering team should implement this version until every owned and inherited blocking finding is closed and the package is independently re-audited.

## Decision-Complete Remediation Backlog

### V15-F01: Source and host adapter scope contradicts the roadmap

- **Severity:** critical
- **Owner:** Architecture Governance and Plugin Maintainers
- **Source:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md`
- **Target:** `docs/versions/version-specifications.json`
- **Required artifact:** Governed roadmap reconciliation and regenerated v1.5 package
- **Dependency:** v2.1 canonical package contracts
- **Impact:** Implementers cannot know the authorized boundary and may prematurely create canonical package or installation behavior reserved for v2.1.
- **Remediation:** Align the committed feature to read-only detection, acquisition planning, inspection, and reporting; classify conversion and installation as deferred unless an approved roadmap change moves their dependencies.
- **Closure evidence:** Roadmap, source specification, generated package, feature traceability, and acceptance gates express one identical boundary.
- **Re-audit:** Required

### V15-F02: Cross-platform isolation boundary is unresolved

- **Severity:** critical
- **Owner:** Security and Plugin Runtime Maintainers
- **Source:** `docs/versions/v1.5.0/decisions/index.md`
- **Target:** `docs/versions/v1.5.0/architecture/plugin-isolation-threat-model.md`
- **Required artifact:** Approved isolation ADR and threat model per operating system
- **Dependency:** Supported Node runtimes and operating systems
- **Impact:** A malicious plugin may escape intended filesystem, network, process, environment, or resource restrictions.
- **Remediation:** Define process identity, environment, working directory, filesystem roots, network mediation, subprocess policy, OS controls, resource limits, cleanup, crash containment, and unsupported-platform behavior.
- **Closure evidence:** Independent threat review and adversarial tests demonstrating denied filesystem, network, process, credential, and state access on every supported OS.
- **Re-audit:** Required

### V15-F03: JSON-RPC protocol is insufficiently specified

- **Severity:** critical
- **Owner:** Plugin Runtime Maintainers
- **Source:** `docs/plugins/runtime.md`
- **Target:** `docs/versions/v1.5.0/interfaces/plugin-rpc-v1.md`
- **Required artifact:** Versioned RPC schema and state machine
- **Dependency:** Plugin manifest v3 and host-mediated capability protocol
- **Impact:** Host and SDK implementations will diverge, deadlock, leak output, or mishandle cancellation and failures.
- **Remediation:** Specify stdin/stdout framing, stderr policy, message size, request IDs, initialization, methods, events, errors, cancellation, timeout, backpressure, shutdown, protocol negotiation, and malformed-message behavior.
- **Closure evidence:** Language-neutral schema, golden transcripts, conformance tests, malformed-frame tests, and compatibility fixtures.
- **Re-audit:** Required

### V15-F04: Host-mediated permission model is not executable

- **Severity:** critical
- **Owner:** Policy and Plugin Runtime Maintainers
- **Source:** `docs/versions/v1.5.0/capabilities/isolated-plugin-runtime.md`
- **Target:** `docs/versions/v1.5.0/interfaces/plugin-permissions-v1.md`
- **Required artifact:** Permission schema, broker API, and policy decision contract
- **Dependency:** Organization, workspace, project, and session policy rules
- **Impact:** Plugins may receive excessive authority or produce inconsistent permission prompts and denials.
- **Remediation:** Define deny-by-default permissions for filesystem, network, provider, process, state, UI, and MCP resources, including selector grammar, precedence, prompts, revocation, upgrade review, and denial errors.
- **Closure evidence:** Bypass-resistance tests cover every alternate CLI and broker path with metadata-only audit output.
- **Re-audit:** Required

### V15-F05: Signing and trust-root policy is undefined

- **Severity:** critical
- **Owner:** Security and Ecosystem Trust Maintainers
- **Source:** `docs/versions/v1.5.0/assurance/assurance-plan.md`
- **Target:** `docs/versions/v1.5.0/assurance/plugin-trust-model.md`
- **Required artifact:** Plugin trust, signing, revocation, and offline verification ADR
- **Dependency:** Local signing workflow and future registry trust model
- **Impact:** Signed manifests cannot be verified consistently and unsigned exceptions may bypass policy.
- **Remediation:** Specify algorithms, key identifiers, canonical bytes, chain validation, local trust stores, organization policy, revocation, expiry, rotation, compromise recovery, offline bundles, and exception lifecycle.
- **Closure evidence:** Valid, invalid, expired, revoked, rotated, tampered, offline, and exception test vectors.
- **Re-audit:** Required

### V15-F06: Plugin lifecycle state machine and recovery are missing

- **Severity:** critical
- **Owner:** Plugin Runtime and State Maintainers
- **Source:** `docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md`
- **Target:** `docs/versions/v1.5.0/architecture/plugin-lifecycle.md`
- **Required artifact:** Lifecycle state machine, journal contract, and ownership model
- **Dependency:** v1.3 StateEngine and managed rollback
- **Impact:** Concurrent commands, crashes, updates, and rollback can corrupt state or activate untrusted versions.
- **Remediation:** Define states, guards, transactions, locks, journals, last-known-good selection, crash recovery, concurrent invocation rules, removal ownership, and registry events.
- **Closure evidence:** State-transition tests cover every valid and invalid transition, interruption point, and rollback outcome.
- **Re-audit:** Required

### V15-F07: Translation compatibility and loss criteria are unresolved

- **Severity:** critical
- **Owner:** Host Adapter Maintainers
- **Source:** `docs/versions/v1.5.0/decisions/index.md`
- **Target:** `docs/versions/v1.5.0/interfaces/host-compatibility-policy.md`
- **Required artifact:** Compatibility classification and loss-report contract
- **Dependency:** HostAdapter research profiles
- **Impact:** Adapters may silently drop semantics, permissions, dependencies, or security constraints.
- **Remediation:** Define semantic equivalence, required loss fields, permission deltas, round-trip expectations, unsupported behavior, host evidence expiry, and manual adaptation ownership.
- **Closure evidence:** Dated fixtures for each researched host and tests that fail on unreported semantic or permission loss.
- **Re-audit:** Required

### V15-F08: MCP transport and authorization policy is generic

- **Severity:** high
- **Owner:** MCP Maintainers
- **Source:** `docs/versions/v1.5.0/interfaces/contracts.md`
- **Target:** `docs/versions/v1.5.0/interfaces/mcp-policy-v1.md`
- **Required artifact:** MCP transport, capability, authentication, and health contract
- **Dependency:** Permission broker and credential-reference model
- **Impact:** MCP servers can receive inconsistent authority or expose unsupported capabilities.
- **Remediation:** Specify supported protocol versions and transports, initialization, authentication references, capability filtering, consent, data flow, cancellation, errors, reconnection, and removal.
- **Closure evidence:** Contract fixtures for supported transports plus denial, malformed, unavailable, credential, and capability mismatch cases.
- **Re-audit:** Required

### V15-F09: Plugin dependency semantics are unspecified

- **Severity:** high
- **Owner:** Plugin Runtime Maintainers
- **Source:** `docs/versions/v1.5.0/capabilities/isolated-plugin-runtime.md`
- **Target:** `docs/versions/v1.5.0/architecture/plugin-dependencies.md`
- **Required artifact:** Pre-registry local dependency resolution policy
- **Dependency:** Plugin manifest schema and v2.1 resolver boundary
- **Impact:** Install and update results are non-deterministic and may activate incompatible dependency graphs.
- **Remediation:** Constrain v1.5 dependency behavior to deterministic local packages, define conflict/cycle rules, lock ownership, atomic activation, rollback, and explicit deferrals to v2.1.
- **Closure evidence:** Golden dependency graphs for valid, conflicting, cyclic, missing, incompatible, update, and rollback scenarios.
- **Re-audit:** Required

### V15-F10: Adversarial and cross-platform test matrices are not specified

- **Severity:** high
- **Owner:** QA, Security, and Plugin Runtime Maintainers
- **Source:** `docs/versions/v1.5.0/evidence/evidence-requirements.json`
- **Target:** `docs/versions/v1.5.0/delivery/plugin-mcp-test-matrix.md`
- **Required artifact:** Adversarial, contract, portability, performance, and recovery test plan
- **Dependency:** Final RPC, permission, trust, lifecycle, and MCP contracts
- **Impact:** The core safety claim that plugins cannot corrupt the host is not reproducible.
- **Remediation:** Define fixtures for malformed RPC, floods, hangs, crashes, escape attempts, dependency attacks, signature failures, revocation, update, rollback, MCP abuse, and every supported OS/runtime.
- **Closure evidence:** Reviewed matrix mapped to each security claim and acceptance gate with deterministic thresholds.
- **Re-audit:** Required

### V15-F11: Declarative plugin migration and runtime compatibility are incomplete

- **Severity:** high
- **Owner:** Plugin Runtime and State Maintainers
- **Source:** `docs/plugins/runtime.md`
- **Target:** `docs/versions/v1.5.0/delivery/plugin-migration-plan.md`
- **Required artifact:** Compatibility, migration, rollback, and deprecation plan
- **Dependency:** Current plugin schema and runtime implementation
- **Impact:** The 1.x compatibility promise may break installed plugins or create ambiguous execution paths.
- **Remediation:** Inventory existing formats and states, define adapters, migration preview, backups, dual-runtime precedence, warnings, rollback, uninstall, and previous-version fixtures.
- **Closure evidence:** Upgrade and rollback rehearsals for representative declarative, one-shot, disabled, trusted, and failed plugins.
- **Re-audit:** Required

### V15-F12: Plugin SDK and support experience lack concrete contracts

- **Severity:** medium
- **Owner:** Plugin SDK and Documentation Maintainers
- **Source:** `docs/versions/v1.5.0/delivery/delivery-plan.md`
- **Target:** `docs/versions/v1.5.0/delivery/plugin-sdk-plan.md`
- **Required artifact:** SDK contract, author journey, examples, troubleshooting, and support lifecycle
- **Dependency:** Final runtime and manifest contracts
- **Impact:** Third-party authors cannot build portable plugins without reverse-engineering host behavior.
- **Remediation:** Specify language support, generated types, test harness, local signing, fixtures, diagnostics, documentation, version compatibility, deprecation, and publisher responsibilities.
- **Closure evidence:** A clean-room author builds, tests, signs, runs, updates, and removes an example plugin using only published documentation.
- **Re-audit:** Required
