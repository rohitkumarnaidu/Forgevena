# Roadmap

The high-level architecture remains frozen. Future work is evidence-driven and follows the canonical [versioned product roadmap](strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md):

1. Maintain the certified `v1.3` state, vault, CLI, recovery, coverage, mutation, fuzz, and performance foundations.
2. Complete `v1.4` provider contracts, privacy classifications, retries, compatibility evidence, and credential-gated smoke tests before expanding higher-level ecosystem claims.
3. Mature plugins, MCP, templates, catalogs, governance, observability, skills, workflows, engineering intelligence, and the governed [Enterprise Update Management System](strategy/ENTERPRISE_UPDATE_MANAGEMENT.md) in dependency order.
4. Add account-backed compatibility testing only in secure, opt-in CI environments.
5. Preserve local-first operation, additive-only project safety, explicit consent, package-manager ownership, signed artifacts, precise rollback, and backward compatibility.
6. Implement an optional remote organization control plane only after local enterprise acceptance passes.
7. After `v2.0`, establish ForgeRegistry protocol and federation before ForgeHub discovery, publishing, organization, intelligence, and trust-network experiences.
8. Target `v3.0` as the evidence-gated AI Engineering Operating System integration point while preserving the complete local client, human authority, registry portability, and optional hosted services.

No roadmap item introduces a new platform layer without demonstrated need and an approved ADR.

The roadmap is binding by default: complete the approved current version in dependency order. Do not skip, reorder, replace, or silently expand a release. A sequence or scope change requires demonstrated evidence, RFC and impact review, an ADR when architecture changes, migration and rollback planning, updated readiness evidence, and explicit maintainer approval. Emergency security or data-loss patches use the incident track and remain narrowly scoped.

Ideas that are not approved release scope live in the [Innovation Opportunity Portfolio](strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md) and advance only through the [Engineering Governance Evidence Funnel](ENGINEERING_GOVERNANCE.md). The [Platform Constitution](strategy/PLATFORM_CONSTITUTION.md) governs all roadmap decisions.

The ecosystem direction separates [ForgeRegistry](architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md), the portable package and resolution foundation, from [ForgeHub](strategy/FORGEHUB_ECOSYSTEM_VISION.md), the user-facing discovery and publisher experience. The [AI Engineering OS evolution](strategy/AI_ENGINEERING_OS_EVOLUTION.md) connects them only after their independent trust and compatibility gates pass.

The future [Enterprise Capability System](architecture/ENTERPRISE_CAPABILITY_SYSTEM.md) defines vendor-neutral capabilities, packages, host adapters, rules, agents, teams, knowledge, interfaces, and delivery assets. The [Orchestration Strategy](architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md) requires deterministic bounded workflows before dynamic agent systems. The [Host Adapter Strategy](architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md) requires explicit compatibility evidence and translation loss reports.

All roadmap documentation follows the [Documentation Governance Standard](governance/DOCUMENTATION_GOVERNANCE_STANDARD.md), its [authority map](governance/DOCUMENTATION_AUTHORITY_MAP.md), and the [Research and Standards Radar](strategy/RESEARCH_AND_STANDARDS_RADAR.md). Generated health, coverage, drift, debt, and historical evidence must pass before roadmap documentation is merge-ready.

[AgentSpace](strategy/FORGEHUB_ECOSYSTEM_VISION.md#agentspace) is the agents-and-teams area inside ForgeHub, while Capability Studio is the shared schema-driven builder. The [External Ecosystem Import and Conversion Strategy](architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md) separates source acquisition, semantic conversion, and host projection so external packages are never treated as automatically compatible capabilities.
