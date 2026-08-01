# v1.4.0 Normative Implementation Contract

> Conforms to the [Implementation Specification Standard](../../foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md).

## Decisions

- **Stable support:** a provider is `stable` only when authentication, health, model discovery, non-streaming invocation, streaming, cancellation, usage normalization, rate-limit classification, structured errors, redaction, and deterministic recorded contract tests pass. Tools and structured output are capability-negotiated and may be `preview`. Evidence expires after 90 days for hosted providers and 180 days for pinned Ollama versions; expired evidence changes support to `stale`, blocks new stable claims, warns existing users, and fails closed for policy-required compatibility.
- **Committed profiles:** OpenAI, Anthropic, Gemini, OpenRouter, and Ollama. Every profile declares endpoint ownership, authentication reference, supported operations, degraded behavior, regional constraints, rate-limit headers, model discovery, and unsupported features.

## Components and State

`ProviderService` owns provider selection and policy; `ProviderAdapter` owns protocol translation; `ProviderRegistry` owns metadata and compatibility evidence; the vault owns credentials; `InvocationCoordinator` owns deadlines, retries, budgets, fallback, cancellation, and usage. Invocation states are `planned`, `authorized`, `running`, `streaming`, `completed`, `cancelled`, `retryable-failure`, `terminal-failure`, and `budget-exhausted`.

## ProviderAdapter v1

Adapters expose `metadata`, `capabilities`, `validateConfiguration`, `health`, `discoverModels`, `invoke`, `stream`, and `cancel`. Requests contain operation ID, model, messages, approved tools, structured-output schema, timeout, idempotency classification, data classification, and budget. Responses contain provider request ID, normalized output, finish reason, usage, warnings, compatibility evidence ID, and raw-provider metadata only from an allowlist. Streaming emits ordered `start`, `content-delta`, `tool-call`, `usage`, `warning`, `complete`, or `error` events.

Normalized failures include authentication, authorization, invalid request, unavailable model, rate limit, quota, timeout, cancellation, transport, provider unavailable, policy denial, compatibility stale, unsafe retry, and malformed response. Provider payloads never appear in user-visible errors by default.

## Resilience and Budgets

Only read-only and explicitly idempotent requests retry automatically. Maximum attempts default to three within the original deadline. Backoff uses full jitter and honors valid `Retry-After`. Fallback requires policy approval, equivalent required capabilities, compatible data-region and privacy policy, remaining cost/token budget, and no externally committed tool effect. Cancellation propagates immediately and suppresses further retries.

## Configuration and Interfaces

Configuration precedence is session restriction, project, workspace, organization, then global defaults; higher-priority scopes may restrict but not expose secrets or bypass policy. Stored values include adapter ID, endpoint profile, default model, allowed models, timeout, retry policy, budgets, and credential reference. CLI, dashboard, and SDK use the same domain service and structured envelope. Credential values are accepted only through masked prompts or approved secret-manager integration.

## Assurance, Testing, and Operations

Prompts, responses, tool payloads, authorization headers, and credentials are `restricted`; usage totals and normalized error classes are `operational metadata`. No restricted content enters logs, diagnostics, registries, or fixtures. Recorded fixtures are sanitized and checksum-verified.

Certification covers every adapter operation, malformed and partial streams, cancellation, rate limits, stale evidence, fallback denial, budget exhaustion, redaction, and offline Ollama behavior. Reference targets are 250 ms adapter overhead at p95 excluding provider latency, cancellation acknowledgement within one second, and zero secret leakage. Provider outages degrade to explicit unavailable status; no hidden fallback occurs.

## Migration and Done

Migration previews legacy provider records, creates a backup, converts only recognized fields, preserves credential references, validates profiles, and rolls back atomically on failure. `v1.4.0` is done when schemas and profiles are approved, all contract fixtures pass, compatibility evidence is dated, migration/rollback rehearsals are retained, and unsupported behavior is reported explicitly.

## Scope, Ownership, Inputs, and Outputs

Provider Platform Maintainers own `provider-adapter-contract` and `provider-resilience-compatibility`. Inputs are validated provider profiles, vault references, normalized requests, policy decisions, deadlines, and budgets. Outputs are normalized responses or streams, usage, health, compatibility evidence, warnings, and stable errors. State and event transitions use the invocation states and ordered stream events defined above; no adapter writes registry or vault state directly.

## Security, Permissions, and Data Flow

Permission checks cover provider use, model selection, tools, data region, fallback, and external transmission. The data flow is caller to policy and consent, then vault-reference resolution, adapter invocation, redaction, normalized output, and metadata-only audit. Restricted payload retention is zero by default; approved usage metadata follows organization retention. Human approval is required before transmitting restricted content, invoking billable tools, broadening permissions, or changing a trust profile.

## Failure, Recovery, Migration, and Rollback

Failure classes map to the normalized errors above. Recovery preserves the original operation ID and deadline, and it never converts a terminal or unsafe request into a retry. Migration follows detect, preview, backup, transform, validate, commit, and recovery states. Rollback restores the prior provider registry snapshot and credential references; roll-forward uses a new schema version and never rewrites retained evidence.

## Service Objectives and Capacity

The service level objective is less than 250 ms p95 adapter overhead for 1,000 recorded requests, excluding provider latency. Cancellation acknowledgement must complete within 1 second, and registry reads must support 500 profiles without unbounded memory growth. The default cost budget is explicit per request and per session; exhaustion stops retries and fallback. Health reports authentication, discovery, invocation, compatibility freshness, and rate-limit state independently.

## Verification and Acceptance Evidence

Required coverage includes unit tests, one shared contract test suite, provider-profile integration tests, CLI end-to-end tests, negative fixtures, adversarial redaction and fallback tests, performance tests, migration tests, rollback tests, and a recovery test for interrupted registry updates. Acceptance evidence records fixture hashes, provider/model scope, operating system, Node.js version, timestamps, limitations, and pass thresholds. The evidence owner is Provider Platform Maintainers, and release evidence retention is at least two supported minor releases.

## AI-Agent Implementation Rules

An AI coding agent must implement only documented adapter capabilities and must not infer provider semantics, permissions, data use, or compatibility. It must fail closed when evidence is missing, stale, conflicting, or unsupported. It may generate previews and tests, but human approval remains required for credentials, live requests, billing, new stable claims, and release promotion.
