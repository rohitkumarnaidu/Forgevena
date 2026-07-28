# Forgevena Platform Constitution

> **Authority:** Canonical and binding for maintainers, contributors, automation, agents, distributions, and future managed services.
>
> **Change control:** Amendments require a public proposal, security and compatibility review, an approved ADR, migration and rollback analysis, and maintainer approval.

## 1. Mission

Forgevena exists to make software delivery governable from idea to production. It gives individuals and organizations a safe, local-first platform for project bootstrap, AI integrations, policy, engineering workflows, verification, and releases without taking ownership away from the developer.

## 2. Trust Contract

1. Mutating operations preview by default.
2. Local writes require explicit `--apply` intent.
3. Network calls, installation, publication, deployment, billing, and other external effects require informed consent.
4. Existing user-project files are skipped, not overwritten.
5. Rollback removes only unchanged assets proven to be Forgevena-managed.
6. Unmanaged files and remote resources are never deleted automatically.
7. Tracked files contain secret references, never secret values.
8. Prompts, responses, credentials, tokens, and authorization data are excluded from state, logs, diagnostics, and analytics.
9. Local capabilities remain usable without an account, network connection, hosted service, or telemetry.
10. Human owners retain promotion authority for releases, deployments, policy, and irreversible effects.

## 3. Product Invariants

- **User ownership:** Users own their code, configuration, credentials, evidence, indexes, policies, and generated assets.
- **Local-first operation:** The open platform remains fully functional locally and offline where the capability itself has no external dependency.
- **Additive safety:** Project adoption augments repositories and never silently rewrites application code.
- **Explainability:** Plans, policy decisions, compatibility results, health findings, and recommendations disclose reasons and evidence.
- **Recoverability:** Managed mutations have ownership records, validation, bounded history, and precise rollback behavior.
- **Verifiability:** Trust claims are supported by tests, signatures, provenance, compatibility evidence, and dated reports.
- **Interoperability:** Providers, plugins, templates, skills, workflows, IDEs, and services use versioned contracts rather than duplicated domain logic.
- **Accessibility:** CLI, documentation, dashboards, templates, and future interfaces must support inclusive, keyboard-accessible, readable operation.
- **Sustainability:** Design decisions account for maintenance load, operational cost, compute cost, energy use, and contributor succession.

## 4. Architecture Boundaries

- The approved 1.x architecture is frozen. New core layers require evidence that existing contracts cannot solve a demonstrated problem and require an approved ADR.
- CLI and user interfaces orchestrate domain services; they do not duplicate provider, policy, state, plugin, bootstrap, or release rules.
- Global tool installation remains separate from project-scoped configuration.
- Credentials remain behind the vault or external secret-manager references.
- Plugins and MCP servers receive scoped, deny-by-default capabilities and never raw credentials.
- Cloud preparation remains separate from deployment, billing, and account ownership.
- A future control plane is optional, self-hostable, and unable to make local operation dependent on a hosted account.

## 5. Compatibility and Lifecycle

- `forgevena`, the transitional `ai-workspace` executable, and `.ai-workspace/` paths remain compatible throughout 1.x.
- Public structured output uses versioned schemas and stable error codes.
- Deprecations require a replacement or rationale, migration guidance, support window, owner, and at least two minor releases of notice unless active exploitation requires faster action.
- Published tags and release evidence are immutable. Corrections use a new version.
- Migrations are previewable, reversible where technically possible, tested against supported prior versions, and never silently discard state.

## 6. Privacy and Analytics

Forgevena collects no telemetry by default. Any future analytics must be opt-in, purpose-limited, minimal, inspectable, exportable, revocable, retention-bounded, and incapable of collecting source, prompts, responses, secrets, credential metadata, or personal content without a separate explicit authorization.

## 7. Product Boundary

| Boundary | Included value |
| --- | --- |
| Open local platform | CLI, state, vault, bootstrap, providers, plugin SDK, templates, policy engine, offline workflows, indexing, and verification. |
| Enterprise capabilities | Fleet governance, advanced compliance packs, organizational approval workflows, long-term support, and enterprise integrations. |
| Optional managed service | Hosted control plane, managed catalogs, fleet operations, support, and explicitly enabled privacy-preserving analytics. |

Commercial features must not weaken local safety, remove an open local capability, create mandatory telemetry, or make core recovery dependent on a vendor service.

## 8. Capability Maturity

| Maturity | Support contract |
| --- | --- |
| `experimental` | Opt-in research; may change; no production support claim. |
| `preview` | Documented evaluation path; compatibility and migration direction provided. |
| `stable` | Supported contract with tests, documentation, compatibility policy, and operational guidance. |
| `enterprise-certified` | Stable plus current security, privacy, reliability, performance, compatibility, accessibility, and support evidence. |
| `deprecated` | Supported only for the declared transition period; replacement and retirement date documented. |

Maturity is an evidence claim, not a marketing label. Unsupported claims fail documentation validation.

## 9. Prohibited Behaviors

Forgevena and its agents must not:

- overwrite or delete unmanaged user assets;
- transmit project content, prompts, responses, credentials, or indexes without explicit scoped consent;
- hide external effects, cost, data destination, permissions, or rollback limitations;
- store raw secrets in tracked files, registries, diagnostics, logs, or analytics;
- bypass policy through alternate commands or interfaces;
- auto-enable unsigned or unapproved ecosystem artifacts;
- claim compatibility, certification, security, privacy, or reliability without current evidence;
- move published tags, rewrite release history, or conceal failed verification;
- introduce mandatory accounts, telemetry, or remote dependencies into local operation;
- trade maintainability and safety for unmeasured feature volume.

## 10. Registry and Marketplace Guarantees

- Registry protocols, lockfiles, packages, policy, evidence, and exports remain portable and publicly specified.
- No public, private, managed, or organization registry is mandatory for complete local operation.
- Federation and mirrors preserve origin identity, signatures, revocation, and deterministic source selection.
- Marketplace ranking is inspectable. Sponsorship is clearly labelled and cannot alter trust, certification, moderation, or organic evidence.
- Publisher identity, namespace ownership, transfer, succession, moderation, appeal, vulnerability, and revocation processes are transparent and auditable.
- Certification is scoped, dated, renewable, appealable, and revocable; popularity is never represented as security.
- Private and air-gapped registries receive the same verification and rollback guarantees as public registries.
- Users can export packages, locks, policies, evidence, and local state without a hosted account.

## 11. Federation and Ecosystem Neutrality

Forgevena must not privilege a registry operator, cloud, provider, publisher, or paid partner through hidden technical or ranking controls. Interoperability, independent implementations, regional mirrors, data residency, and disaster recovery are product requirements. Surveillance advertising and undisclosed paid placement are prohibited.

## 12. Capability and Orchestration Guarantees

- The canonical Forgevena capability package remains vendor-neutral and portable.
- Host-native formats are projections produced by adapters; no host becomes the source of truth.
- Package installation does not imply configuration, activation, invocation, consent, or policy approval.
- Rules are installable capabilities but cannot override platform, organization, workspace, project, host, consent, security, or privacy authority.
- Deny overrides allow, and lower policy layers may restrict but never broaden authority.
- Unsupported or lossy host translations are reported explicitly and never silently discarded.
- Every autonomous loop, recursion path, and delegation chain is bounded by iterations, duration, resources, cost, cancellation, and human authority.
- Unbounded autonomous loops, hidden external effects, unrestricted lifecycle scripts, and credential distribution to untrusted capabilities are prohibited.

## 13. Governance

[Engineering Governance](../ENGINEERING_GOVERNANCE.md) defines intake, review thresholds, readiness, completion, waivers, debt, incidents, releases, and evidence. The [Platform Blueprint](FORGEVENA_PLATFORM_BLUEPRINT.md) defines current product scope. The [Versioned Product Roadmap](FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md) defines approved dependency order. The [Innovation Opportunity Portfolio](INNOVATION_OPPORTUNITY_PORTFOLIO.md) contains uncommitted ideas governed by the Evidence Funnel.

The [Documentation Governance Standard](../governance/DOCUMENTATION_GOVERNANCE_STANDARD.md) defines documentation authority, lifecycle, ownership, freshness, historical preservation, AI-agent safety, and evidence gates. One canonical authority exists per subject; generated references derive from source metadata; historical records remain immutable and clearly separated from current guidance.

The roadmap is the default execution authority. Maintainers and agents must not skip, reorder, replace, or silently expand committed release scope. A change requires demonstrated evidence, governed review, explicit approval, and complete documentation, migration, rollback, and readiness reconciliation. Emergency security or data-loss patches may interrupt sequencing only through incident governance and may not carry unrelated scope.
