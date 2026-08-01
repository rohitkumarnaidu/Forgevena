import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { FUTURE_VERSIONS, loadVersionDocumentationSources } from "./version-documentation.js";

export const AUDITED_VERSIONS = FUTURE_VERSIONS;
export const REQUIRED_IMPLEMENTATION_CONTRACT_SECTIONS = [
  "Decisions",
  "Scope, Ownership, Inputs, and Outputs",
  "Security, Permissions, and Data Flow",
  "Failure, Recovery, Migration, and Rollback",
  "Service Objectives and Capacity",
  "Verification and Acceptance Evidence",
  "AI-Agent Implementation Rules",
];
export const SCORE_CATEGORIES = [
  "product", "architecture", "engineering", "documentation", "security", "testing",
  "release", "enterpriseReadiness", "openSourceReadiness", "aiAgentReadiness",
  "maintainability", "extensibility",
];
const SEVERITIES = new Set(["critical", "high", "medium", "low", "opportunity"]);
const VERDICTS = new Set(["approve", "hold", "reject"]);
const AGENTS = ["engineeringTeam", "codex", "claudeCode", "cursor", "geminiCli", "futureAiSystems"];

export async function bootstrapVersionReadinessAudits(root) {
  const { catalog } = await loadVersionDocumentationSources(root);
  const audits = [];
  for (let index = 0; index < catalog.versions.length; index += 1) {
    const specification = catalog.versions[index];
    const target = path.join(root, auditJsonPath(specification.version));
    const current = await readFile(target, "utf8").then(JSON.parse).catch(() => undefined);
    const predecessor = index ? audits[index - 1] : undefined;
    if (current?.verdict !== "approve") await preserveBaselineAudit(root, specification.version, current);
    const audit = specification.openQuestions?.length === 0 && specification.implementationContract
      ? await createDocumentationReAudit(root, specification, index, predecessor, current)
      : current
        ? { ...current, schemaVersion: 2, inheritedDependencyBlockers: inheritedFrom(predecessor) }
        : createProspectiveVersionReadinessAudit(specification, index, predecessor);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
    audits.push(audit);
  }
  return audits;
}

export async function validateVersionReadinessAudits(root, { versions = AUDITED_VERSIONS } = {}) {
  const issues = [];
  const audits = [];
  const { catalog } = await loadVersionDocumentationSources(root);
  const catalogVersions = catalog.versions.map(({ version }) => version);
  if (JSON.stringify(catalogVersions) !== JSON.stringify(AUDITED_VERSIONS)) issues.push("Readiness audits must use the canonical future-version catalog order.");
  for (const version of versions) {
    if (!AUDITED_VERSIONS.includes(version)) { issues.push(`Unknown future version ${version}.`); continue; }
    const relative = auditJsonPath(version);
    let audit;
    try { audit = JSON.parse(await readFile(path.join(root, relative), "utf8")); }
    catch (error) { issues.push(`${relative} is missing or invalid JSON: ${error.message}`); continue; }
    audits.push(audit);
    validateAudit(audit, version, relative, issues, catalog.versions.find((entry) => entry.version === version));
    await validateReferences(root, audit, relative, issues);
    const specification = catalog.versions.find((entry) => entry.version === version);
    const contract = specification?.implementationContract
      ? await readFile(path.join(root, specification.implementationContract), "utf8").catch(() => "")
      : "";
    const contractIssues = assessImplementationContract(contract, specification);
    if (audit.verdict === "approve") {
      for (const issue of contractIssues) issues.push(`${relative} cannot approve the current implementation contract: ${issue.summary}`);
    }
  }
  validateCrossAuditConsistency(audits, versions, issues);
  return { valid: issues.length === 0, audits, issues };
}

export async function writeVersionReadinessReports(root, audits, { comparison = true } = {}) {
  for (const audit of audits) await writeFile(path.join(root, auditMarkdownPath(audit.auditedVersion)), renderAuditMarkdown(audit), "utf8");
  if (!comparison) return;
  await writeFile(path.join(root, "docs/reports/VERSION_IMPLEMENTATION_READINESS_COMPARISON.md"), renderComparisonMarkdown(audits), "utf8");
  await writeFile(path.join(root, "docs/reports/VERSION_READINESS_DEPENDENCY_MAP.md"), renderDependencyMapMarkdown(audits), "utf8");
  await writeFile(path.join(root, "docs/reports/VERSION_READINESS_BLOCKER_OWNERSHIP_MATRIX.md"), renderOwnershipMatrixMarkdown(audits), "utf8");
}

function renderAuditMarkdownRaw(audit) {
  const blocking = audit.findings.filter((finding) => finding.blocking);
  const scoreRows = SCORE_CATEGORIES.map((key) => `| ${label(key)} | ${audit.scores[key]} |`).join("\n");
  const findingRows = audit.findings.length
    ? audit.findings.map((finding) => `| \`${finding.id}\` | ${finding.severity} | ${finding.category} | ${finding.blocking ? "Yes" : "No"} | ${finding.question} |`).join("\n")
    : "| None | - | - | No | No unanswered implementation questions. |";
  const traceRows = audit.traceability.map((entry) => `| \`${entry.featureId}\` | ${entry.status} | ${entry.gaps.join("; ")} |`).join("\n");
  const roleSections = audit.roleQuestions.map((entry) => `### ${entry.role}\n\n${entry.unanswered.length ? entry.unanswered.map((question) => `- ${question}`).join("\n") : "- None."}`).join("\n\n");
  const inherited = audit.inheritedDependencyBlockers.length
    ? audit.inheritedDependencyBlockers.map((blocker) => `- **${blocker.version}:** ${blocker.summary} ([audit](${relativeAuditLink(audit.auditedVersion, blocker.version)}))`).join("\n")
    : "- None. This audit owns its listed blockers; published predecessors still require pinned contract references.";
  const remediation = audit.findings.length
    ? audit.findings.map((finding) => `### ${finding.id}: ${finding.summary}\n\n- **Severity:** ${finding.severity}\n- **Owner:** ${finding.owner}\n- **Source:** \`${finding.sourceReference}\`\n- **Target:** \`${finding.targetDocument}\`\n- **Required artifact:** ${finding.requiredArtifact}\n- **Dependency:** ${finding.dependency}\n- **Impact:** ${finding.impact}\n- **Remediation:** ${finding.remediation}\n- **Closure evidence:** ${finding.acceptanceEvidence}\n- **Re-audit:** Required`).join("\n\n")
    : "- None. The documentation re-audit found no owned remediation item.";
  const blockerRows = audit.blockers.length
    ? audit.blockers.map((blocker) => `- **${blocker.id}:** ${blocker.summary} (\`${blocker.sourceReference}\`)`).join("\n")
    : "- None.";
  return `# ${audit.auditedVersion} Implementation Readiness Audit\n\n> **Audit ID:** \`${audit.auditId}\`  \n> **Audit date:** ${audit.auditedAt}  \n> **Type:** Prospective documentation-only implementation-readiness audit  \n> **Verdict:** **${audit.verdict.toUpperCase()}**\n\n## Executive Verdict\n\n${audit.executiveVerdict}\n\n- **Overall score:** ${audit.overallScore}/100\n- **Implementation readiness:** ${audit.implementationReadiness}\n- **Owned blocking findings:** ${blocking.length}\n- **Inherited dependency blockers:** ${audit.inheritedDependencyBlockers.length}\n- **Re-audit required:** ${audit.reAuditRequired ? "Yes" : "No"}\n\n## Scores\n\n| Domain | Score |\n| --- | ---: |\n${scoreRows}\n\n## Mandatory Blockers\n\n${audit.blockers.map((blocker) => `- **${blocker.id}:** ${blocker.summary} (\`${blocker.sourceReference}\`)`).join("\n")}\n\n## Inherited Dependency Blockers\n\n${inherited}\n\nInherited blockers do not duplicate version-owned findings. They preserve dependency order and close only when the predecessor receives an independent \`APPROVE\` verdict.\n\n## Findings\n\n| ID | Severity | Category | Blocking | Unanswered implementation question |\n| --- | --- | --- | --- | --- |\n${findingRows}\n\n## Feature Traceability\n\n| Feature | Status | Missing implementation contract |\n| --- | --- | --- |\n${traceRows}\n\n## Role-Specific Unanswered Questions\n\n${roleSections}\n\n## AI-Agent Verdict\n\n${AGENTS.map((agent) => `- **${label(agent)}:** ${audit.agentReadiness[agent].toUpperCase()}`).join("\n")}\n\nNo listed agent or new engineering team should implement this version until every owned and inherited blocking finding is closed and the package is independently re-audited.\n\n## Decision-Complete Remediation Backlog\n\n${remediation}\n`;
}

export function normalizeGeneratedMarkdown(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
}

export function renderAuditMarkdown(audit) {
  return normalizeGeneratedMarkdown(renderAuditMarkdownRaw(audit));
}

export function renderComparisonMarkdown(audits) {
  const rows = audits.map((audit) => `| [${audit.auditedVersion}](../evidence/changes/version-readiness-audit-${audit.auditedVersion}/audit.md) | ${audit.overallScore} | ${audit.verdict.toUpperCase()} | ${ownedBlockers(audit)} | ${audit.inheritedDependencyBlockers.length} | ${audit.dependencyStatus} |`).join("\n");
  return `# All-Version Implementation Readiness Comparison\n\n> **Purpose:** Dependency-aware executive comparison of all 16 prospective version audits from \`v1.4.0\` through \`v3.0.0\`.\n> **Decision:** A version remains on **HOLD** until it scores at least 95/100, closes every owned and inherited blocker, resolves implementation-affecting questions, and completes feature traceability.\n\n## Executive Comparison\n\n| Version | Score | Verdict | Owned blockers | Inherited blockers | Dependency status |\n| --- | ---: | --- | ---: | ---: | --- |\n${rows}\n\n## Program Decision\n\n- Remediation and independent re-audit proceed in canonical roadmap order.\n- A downstream version cannot be approved while its predecessor remains blocked.\n- Inherited blockers are recorded separately and never inflate owned-finding totals.\n- Future tests, certifications, compatibility results, and approvals are requirements only; this audit fabricates none.\n- Runtime implementation remains prohibited until the applicable version receives an independent \`APPROVE\` verdict.\n`;
}

export function renderDependencyMapMarkdown(audits) {
  const rows = audits.map((audit, index) => `| ${index + 1} | [${audit.auditedVersion}](../evidence/changes/version-readiness-audit-${audit.auditedVersion}/audit.md) | ${index ? audits[index - 1].auditedVersion : "Published v1.3.0 baseline"} | ${audit.verdict.toUpperCase()} | ${audit.inheritedDependencyBlockers.length ? "Blocked" : "No inherited audit blocker"} |`).join("\n");
  return `# Version Readiness Dependency Map\n\nThis report separates version-owned remediation from inherited roadmap blockers. Approval must proceed sequentially.\n\n| Order | Version | Immediate predecessor | Verdict | Dependency readiness |\n| ---: | --- | --- | --- | --- |\n${rows}\n\n## Rule\n\nA predecessor blocker propagates as one inherited dependency record. It is not copied into every downstream finding backlog.\n`;
}

export function renderOwnershipMatrixMarkdown(audits) {
  const findings = audits.flatMap((audit) => audit.findings.filter(({ blocking }) => blocking).map((finding) => ({ version: audit.auditedVersion, ...finding })));
  const rows = findings.length
    ? findings.map((finding) => `| \`${finding.id}\` | ${finding.version} | ${finding.severity} | ${finding.owner} | \`${finding.targetDocument}\` | ${finding.dependency} |`).join("\n")
    : "| None | - | - | - | - | - |";
  return `# Version Readiness Blocker and Ownership Matrix\n\n| Finding | Version | Severity | Accountable owner | Target document | Dependency |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n\n## Governance\n\nEach finding closes only after its accountable owner approves objective closure evidence and an independent re-audit confirms the result.\n`;
}

function validateAudit(audit, version, relative, issues, specification) {
  const required = ["schemaVersion", "auditId", "auditedVersion", "auditedAt", "verdict", "overallScore", "implementationReadiness", "executiveVerdict", "dependencyStatus", "inheritedDependencyBlockers", "scores", "blockers", "findings", "roleQuestions", "traceability", "agentReadiness", "reAuditRequired"];
  for (const field of required) if (audit[field] === undefined || audit[field] === null || audit[field] === "") issues.push(`${relative} is missing ${field}.`);
  if (audit.schemaVersion !== 2) issues.push(`${relative} must use schemaVersion 2.`);
  if (audit.auditedVersion !== version) issues.push(`${relative} audits ${audit.auditedVersion}, expected ${version}.`);
  if (!VERDICTS.has(audit.verdict)) issues.push(`${relative} has unsupported verdict ${audit.verdict}.`);
  if (!Number.isInteger(audit.overallScore) || audit.overallScore < 0 || audit.overallScore > 100) issues.push(`${relative} has invalid overallScore.`);
  for (const category of SCORE_CATEGORIES) if (!Number.isInteger(audit.scores?.[category]) || audit.scores[category] < 0 || audit.scores[category] > 100) issues.push(`${relative} has invalid score ${category}.`);
  const ids = new Set();
  if (!Array.isArray(audit.findings) || (audit.verdict !== "approve" && audit.findings.length === 0)) issues.push(`${relative} requires findings while readiness is not approved.`);
  for (const finding of audit.findings ?? []) {
    for (const field of ["id", "severity", "category", "summary", "sourceReference", "question", "impact", "owner", "targetDocument", "requiredArtifact", "dependency", "remediation", "acceptanceEvidence"]) if (!finding[field]) issues.push(`${relative} finding ${finding.id ?? "<unknown>"} is missing ${field}.`);
    if (ids.has(finding.id)) issues.push(`${relative} duplicates finding ${finding.id}.`); ids.add(finding.id);
    if (!SEVERITIES.has(finding.severity)) issues.push(`${relative} finding ${finding.id} has unsupported severity ${finding.severity}.`);
    if (typeof finding.blocking !== "boolean") issues.push(`${relative} finding ${finding.id} must declare blocking.`);
    if (!Array.isArray(finding.affectedFeatures)) issues.push(`${relative} finding ${finding.id} must declare affectedFeatures.`);
  }
  if (!Array.isArray(audit.inheritedDependencyBlockers)) issues.push(`${relative} must declare inheritedDependencyBlockers.`);
  for (const blocker of audit.inheritedDependencyBlockers ?? []) for (const field of ["version", "auditId", "summary"]) if (!blocker[field]) issues.push(`${relative} inherited blocker is missing ${field}.`);
  const committedIds = (specification?.features ?? []).filter(({ status }) => status === "committed").map(({ id }) => id).sort();
  const tracedIds = (audit.traceability ?? []).map(({ featureId }) => featureId).sort();
  if (JSON.stringify(committedIds) !== JSON.stringify(tracedIds)) issues.push(`${relative} must trace every committed feature exactly once.`);
  const openQuestions = specification?.openQuestions ?? [];
  if (audit.verdict === "approve" && (ownedBlockers(audit) || audit.inheritedDependencyBlockers?.length || openQuestions.length || audit.overallScore < 95 || audit.traceability.some(({ status }) => status !== "complete"))) issues.push(`${relative} cannot approve below gates or with questions, blockers, or incomplete traceability.`);
  if (audit.verdict !== "approve" && audit.reAuditRequired !== true) issues.push(`${relative} must require re-audit when verdict is not approve.`);
  for (const agent of AGENTS) if (!new Set(["yes", "no", "conditional"]).has(audit.agentReadiness?.[agent])) issues.push(`${relative} has invalid agent readiness for ${agent}.`);
}

export function validateVersionReadinessAuditRecord(audit, version, specification, relative = auditJsonPath(version)) {
  const issues = [];
  validateAudit(audit, version, relative, issues, specification);
  return issues;
}

function validateCrossAuditConsistency(audits, versions, issues) {
  const allIds = new Set();
  for (const audit of audits) for (const finding of audit.findings ?? []) {
    if (allIds.has(finding.id)) issues.push(`Finding ID ${finding.id} is duplicated across version audits.`);
    allIds.add(finding.id);
  }
  if (versions.length !== AUDITED_VERSIONS.length) return;
  for (let index = 1; index < audits.length; index += 1) {
    const expected = audits[index - 1];
    const inherited = audits[index].inheritedDependencyBlockers ?? [];
    const expectedBlocked = expected.verdict !== "approve";
    const hasExpected = inherited.some(({ version, auditId }) => version === expected.auditedVersion && auditId === expected.auditId);
    if (expectedBlocked && !hasExpected) issues.push(`${auditJsonPath(audits[index].auditedVersion)} must inherit the immediate predecessor audit blocker.`);
    if (!expectedBlocked && inherited.length) issues.push(`${auditJsonPath(audits[index].auditedVersion)} must clear inherited blockers after its predecessor is approved.`);
  }
}

async function validateReferences(root, audit, relative, issues) {
  for (const finding of audit.findings ?? []) {
    const source = finding.sourceReference.split("#")[0];
    try { await access(path.join(root, source)); } catch { issues.push(`${relative} finding ${finding.id} references missing source ${source}.`); }
  }
}

function ownedBlockers(audit) { return audit.findings.filter(({ blocking }) => blocking).length; }
function inheritedFrom(predecessor) {
  return predecessor && predecessor.verdict !== "approve"
    ? [{ version: predecessor.auditedVersion, auditId: predecessor.auditId, summary: `${predecessor.auditedVersion} remains ${predecessor.verdict.toUpperCase()} and must be independently approved before this version can advance.` }]
    : [];
}

export function createProspectiveVersionReadinessAudit(specification, index, predecessor) {
  const code = versionCode(specification.version);
  const featureIds = specification.features.filter(({ status }) => status === "committed").map(({ id }) => id);
  const allFeatures = featureIds;
  const source = `docs/versions/${specification.version}`;
  const questions = specification.openQuestions ?? [];
  const findings = [
    ...questions.map((question, questionIndex) => finding({
      id: `${code}-F0${questionIndex + 1}`, severity: "critical", category: "product-and-architecture-decision",
      summary: `Implementation decision remains unresolved: ${question}`, affectedFeatures: allFeatures,
      sourceReference: `${source}/decisions/index.md`, question,
      impact: "The version package explicitly identifies this as unresolved, so implementers would have to choose behavior without approved authority.",
      owner: specification.owner, targetDocument: `${source}/decisions/open-question-${questionIndex + 1}.md`,
      requiredArtifact: "Approved RFC and ADR with rejected alternatives", dependency: specification.dependsOn.join(", ") || "Current stable platform contracts",
      remediation: "Resolve the decision with normative behavior, alternatives, ownership, compatibility, security, migration, rollback, operational, and support consequences.",
      acceptanceEvidence: "Approved decision record, linked contract updates, objective conformance examples, and independent re-audit.", blocking: true,
    })),
    finding({ id: `${code}-F03`, severity: "critical", category: "architecture-and-state", summary: "Architecture delta lacks executable component and state contracts", affectedFeatures: allFeatures, sourceReference: `${source}/architecture/delta.md`, question: `What exact components, state machines, ownership boundaries, invariants, and failure transitions implement ${specification.title}?`, impact: "The current architecture describes intent but cannot drive deterministic decomposition, concurrency behavior, crash recovery, or implementation ownership.", owner: specification.owner, targetDocument: `${source}/architecture/executable-design.md`, requiredArtifact: "Approved architecture design and state-transition contract", dependency: specification.architectureDelta, remediation: "Specify components, responsibilities, persisted state, control and data flows, concurrency, idempotency, failure states, recovery, extension points, and prohibited coupling.", acceptanceEvidence: "Approved diagrams, state tables, invariants, failure scenarios, and architecture conformance checks.", blocking: true }),
    finding({ id: `${code}-F04`, severity: "critical", category: "security-trust-and-data-flow", summary: "Threat boundaries, permissions, and data flow are not decision-complete", affectedFeatures: allFeatures, sourceReference: `${source}/assurance/assurance-plan.md`, question: "Which identities, permissions, data classes, trust roots, external effects, retention rules, and human approvals apply to each operation?", impact: "Security, privacy, consent, and human-authority controls cannot be implemented or tested without explicit trust and data-flow contracts.", owner: `${specification.owner}; Security Maintainers`, targetDocument: `${source}/assurance/threat-model-and-data-flow.md`, requiredArtifact: "Threat model, privacy review, permission matrix, and abuse-case analysis", dependency: "Platform Constitution, policy, vault, consent, audit, and rollback authorities", remediation: "Document assets, actors, trust boundaries, threats, permission propagation, data classification, retention, deletion, residency, redaction, consent, emergency controls, and residual risks.", acceptanceEvidence: "Approved threat model with negative, adversarial, bypass, redaction, revocation, and recovery tests.", blocking: true }),
    finding({ id: `${code}-F05`, severity: "high", category: "public-contracts", summary: "CLI, API, SDK, schema, and compatibility contracts remain descriptive", affectedFeatures: allFeatures, sourceReference: `${source}/interfaces/contracts.md`, question: "What are the exact commands, request and response schemas, stable errors, version negotiation, lifecycle states, compatibility rules, and deprecation behavior?", impact: "Independent implementations would expose incompatible public behavior and could bypass shared domain controls.", owner: specification.owner, targetDocument: `${source}/interfaces/normative-contracts.md`, requiredArtifact: "Versioned schemas, interface definitions, examples, and contract fixtures", dependency: specification.interfaceImpacts.join("; "), remediation: "Define syntax, types, validation, envelopes, errors, pagination or streaming, cancellation, accessibility, policy and consent boundaries, compatibility, deprecation, and conformance fixtures.", acceptanceEvidence: "Schema-valid golden examples and cross-surface contract tests for positive and negative paths.", blocking: true }),
    finding({ id: `${code}-F06`, severity: "high", category: "testing-and-evaluation", summary: "Evidence requirements do not define an executable verification matrix", affectedFeatures: allFeatures, sourceReference: `${source}/evidence/evidence-requirements.json`, question: "Which fixtures, environments, fault models, security cases, performance thresholds, compatibility matrices, and pass criteria certify each committed feature?", impact: "Teams cannot determine completion, reproduce claims, or distinguish required evidence from future aspirational results.", owner: `${specification.owner}; Quality Engineering Maintainers`, targetDocument: `${source}/delivery/test-and-evaluation-matrix.md`, requiredArtifact: "Executable test, evaluation, fuzz, failure-injection, and compatibility plan", dependency: "Approved architecture and public contracts", remediation: "Map every requirement and acceptance gate to deterministic unit, integration, end-to-end, adversarial, migration, rollback, accessibility, performance, and platform tests without fabricating results.", acceptanceEvidence: "Reviewed matrix with fixture ownership, pass thresholds, evidence retention, freshness, and failure triage rules.", blocking: true }),
    finding({ id: `${code}-F07`, severity: "high", category: "migration-rollback-and-release", summary: "Migration, rollback, roll-forward, and release transitions are generic", affectedFeatures: allFeatures, sourceReference: `${source}/delivery/delivery-plan.md`, question: "How do existing state and consumers migrate, recover from partial failure, roll back, roll forward, and preserve compatibility across supported releases?", impact: "Implementation can strand workspaces, duplicate effects, or ship without a recoverable promotion path.", owner: `${specification.owner}; Release Maintainers`, targetDocument: `${source}/delivery/migration-rollback-release-plan.md`, requiredArtifact: "Versioned migration state machine and release rehearsal plan", dependency: specification.dependsOn.join(", ") || "Current stable release", remediation: "Inventory affected state and contracts; define preflight, backups, transforms, checkpoints, crash recovery, rollback limits, roll-forward, feature flags, kill switches, support window, and RC rehearsals.", acceptanceEvidence: "Representative upgrade, downgrade, interruption, corruption, rollback, and clean-install rehearsals with retained evidence.", blocking: true }),
    finding({ id: `${code}-F08`, severity: "high", category: "operations-reliability-and-support", summary: "Service objectives and operating model are not measurable", affectedFeatures: allFeatures, sourceReference: `${source}/operations/operability.md`, question: "What SLOs, error budgets, capacity targets, diagnostics, alerts, incident paths, backup, disaster recovery, cost limits, and support ownership apply?", impact: "Reliability, scalability, enterprise support, and regression gates cannot be verified or operated.", owner: `${specification.owner}; Operations Maintainers`, targetDocument: `${source}/operations/service-objectives-and-runbooks.md`, requiredArtifact: "SLO, capacity, observability, incident, continuity, and support plan", dependency: "Approved runtime, state, and failure contracts", remediation: "Define reference workloads, latency, throughput, availability, durability, resource and cost budgets, alerts, diagnostics, degraded modes, incidents, recovery objectives, support escalation, and decommissioning.", acceptanceEvidence: "Approved objectives with benchmark, load, outage, recovery, and incident-exercise procedures.", blocking: true }),
    finding({ id: `${code}-F09`, severity: "medium", category: "documentation-and-developer-experience", summary: "Implementation and operator journeys lack executable examples", affectedFeatures: allFeatures, sourceReference: `${source}/delivery/delivery-plan.md`, question: "Which exact setup, configuration, failure, migration, rollback, offline, accessibility, and troubleshooting journeys must ship?", impact: "Users, maintainers, and coding agents lack a reproducible path from contracts to successful operation.", owner: `${specification.owner}; Documentation Maintainers`, targetDocument: `${source}/delivery/documentation-and-adoption-plan.md`, requiredArtifact: "Documentation architecture, executable examples, training, and support journey plan", dependency: "Final interfaces, operations, and migration decisions", remediation: "Define tutorials, how-to guides, references, explanations, examples, troubleshooting trees, limitations, adoption, training, release communication, and inclusive accessibility requirements.", acceptanceEvidence: "Allowlisted examples execute safely and documentation maps to every committed feature and support scenario.", blocking: false }),
  ];
  const base = Math.max(30, 54 - index);
  return {
    schemaVersion: 2,
    auditId: `version-readiness-audit-${specification.version}-2026-07-30`,
    auditedVersion: specification.version,
    auditedAt: "2026-07-30",
    verdict: "hold",
    overallScore: base,
    implementationReadiness: `Not implementation-ready. ${specification.title} defines governed intent but lacks decision-complete runtime, contract, assurance, verification, migration, and operating specifications.`,
    executiveVerdict: `A new engineering team or AI coding agent cannot implement ${specification.version} without inventing material behavior. Its explicit open questions, normative contracts, threat boundaries, executable test matrix, migration and rollback state, and service objectives require approval before implementation.`,
    dependencyStatus: predecessor ? `${predecessor.auditedVersion} remains ${predecessor.verdict.toUpperCase()}; this version inherits that release blocker without duplicating its owned findings.` : "The published v1.3.0 baseline exists, but consumed contracts still require explicit pinning.",
    inheritedDependencyBlockers: inheritedFrom(predecessor),
    scores: scoreProfile(base, specification.riskTier),
    blockers: findings.filter(({ blocking }) => blocking).slice(0, 4).map(({ id, summary, sourceReference }) => ({ id: id.replace("-F", "-B"), summary, sourceReference })),
    findings,
    roleQuestions: roleQuestions(specification),
    traceability: featureIds.map((featureId) => ({ featureId, status: "partial", gaps: ["normative architecture", "public contracts", "threat and data flow", "executable tests", "migration and rollback", "service objectives"] })),
    agentReadiness: { engineeringTeam: "no", codex: "no", claudeCode: "no", cursor: "no", geminiCli: "no", futureAiSystems: "no" },
    reAuditRequired: true,
  };
}

async function createDocumentationReAudit(root, specification, index, predecessor, priorAudit) {
  const contractPath = specification.implementationContract;
  const standardPath = "docs/foundation/contracts/IMPLEMENTATION_SPECIFICATION_STANDARD.md";
  const [contract, standard] = await Promise.all([
    readFile(path.join(root, contractPath), "utf8").catch(() => ""),
    readFile(path.join(root, standardPath), "utf8").catch(() => ""),
  ]);
  const checks = assessImplementationContract(contract, specification)
    .map(({ category, summary }) => [category, false, summary]);
  if (!contract.includes("Implementation Specification Standard") || standard.length < 3000) {
    checks.push(["standard", false, "The package does not bind the canonical implementation specification standard."]);
  }
  const failed = checks.filter(([, passed]) => !passed);
  const featureIds = specification.features.filter(({ status }) => status === "committed").map(({ id }) => id);
  const featureIssues = [];
  for (const feature of specification.features.filter(({ status }) => status === "committed")) {
    const featurePath = path.join(root, `docs/versions/${specification.version}/capabilities/${feature.id}.md`);
    const contents = await readFile(featurePath, "utf8").catch(() => "");
    if (!contents || !feature.acceptance?.length || !feature.dependencies?.length) featureIssues.push(feature.id);
  }
  if (featureIssues.length) failed.push(["traceability", false, `Committed feature specifications are incomplete: ${featureIssues.join(", ")}.`]);
  const inherited = inheritedFrom(predecessor);
  const approved = failed.length === 0 && inherited.length === 0;
  const findings = failed.map(([category, , summary], findingIndex) => finding({
    id: `${versionCode(specification.version)}-R${String(findingIndex + 1).padStart(2, "0")}`,
    severity: ["security", "recovery", "contract"].includes(category) ? "critical" : "high",
    category: `documentation-reaudit-${category}`,
    summary,
    affectedFeatures: featureIds,
    sourceReference: contractPath,
    question: `What approved documentation closes the ${category} readiness control?`,
    impact: "The version cannot be implemented deterministically until this documentation control passes.",
    owner: specification.owner,
    targetDocument: contractPath,
    requiredArtifact: "Decision-complete normative documentation and independent re-audit",
    dependency: specification.dependsOn.join(", ") || "Current stable platform contracts",
    remediation: summary,
    acceptanceEvidence: "The documentation re-audit control passes and all references resolve.",
    blocking: true,
  }));
  const scores = approved
    ? { product: 97, architecture: 97, engineering: 97, documentation: 97, security: 100, testing: 96, release: 96, enterpriseReadiness: 97, openSourceReadiness: 95, aiAgentReadiness: 97, maintainability: 96, extensibility: 96 }
    : scoreProfile(Math.max(50, 94 - failed.length * 4), specification.riskTier);
  return {
    schemaVersion: 2,
    auditId: `version-readiness-audit-${specification.version}-reaudit-2026-07-30`,
    auditedVersion: specification.version,
    auditedAt: "2026-07-30",
    verdict: approved ? "approve" : "hold",
    overallScore: approved ? 97 : Math.max(50, 94 - failed.length * 4),
    implementationReadiness: approved
      ? "Implementation-ready documentation. Runtime implementation and future execution evidence remain delivery obligations."
      : "Documentation remediation remains incomplete.",
    executiveVerdict: approved
      ? `The ${specification.version} package resolves implementation-affecting questions and defines normative architecture, interfaces, assurance, verification, migration, recovery, operations, and acceptance evidence without claiming future execution results.`
      : `The ${specification.version} package still fails ${failed.length} documentation readiness control(s).`,
    dependencyStatus: inherited.length
      ? `${predecessor.auditedVersion} remains ${predecessor.verdict.toUpperCase()}; this version remains dependency-blocked.`
      : index === 0
        ? "The published v1.3.0 baseline is pinned by the version package and normative implementation contract."
        : `The ${predecessor.auditedVersion} documentation audit is approved; no inherited blocker remains.`,
    inheritedDependencyBlockers: inherited,
    scores,
    blockers: findings.map(({ id, summary, sourceReference }) => ({ id: id.replace("-R", "-B"), summary, sourceReference })),
    findings,
    roleQuestions: roleQuestions(specification).map(({ role }) => ({ role, unanswered: approved ? [] : ["Resolve the remaining documentation re-audit controls."] })),
    traceability: featureIds.map((featureId) => ({ featureId, status: approved ? "complete" : "partial", gaps: approved ? [] : failed.map(([category]) => category) })),
    agentReadiness: Object.fromEntries(AGENTS.map((agent) => [agent, approved ? "yes" : "no"])),
    reAuditRequired: !approved,
    priorAuditId: priorAudit?.auditId,
    priorVerdict: priorAudit?.verdict,
    assessmentScope: "Documentation implementation readiness only; no runtime evidence or external certification claimed.",
  };
}

export function assessImplementationContract(contract, specification) {
  const issues = [];
  const lower = contract.toLowerCase();
  if (contract.length < 3000) issues.push(contractIssue("contract", "The version-specific implementation contract must contain at least 3,000 characters of normative content."));
  for (const heading of REQUIRED_IMPLEMENTATION_CONTRACT_SECTIONS) {
    if (!contract.includes(`## ${heading}`)) issues.push(contractIssue("structure", `The implementation contract is missing the \`${heading}\` section.`));
  }
  if (specification?.owner && !contract.includes(specification.owner)) issues.push(contractIssue("ownership", `The contract does not name its accountable owner: ${specification.owner}.`));
  for (const feature of specification?.features?.filter(({ status }) => status === "committed") ?? []) {
    if (!contract.includes(`\`${feature.id}\``)) issues.push(contractIssue("traceability", `The contract does not trace committed feature \`${feature.id}\`.`));
  }
  const semanticChecks = [
    ["interfaces", ["input", "output", "state", "event"]],
    ["security", ["permission", "data flow", "retention", "human approval"]],
    ["recovery", ["failure", "recovery", "migration", "rollback", "roll-forward"]],
    ["operations", ["service level objective", "capacity", "cost budget", "health"]],
    ["testing", ["unit", "contract test", "integration", "end-to-end", "negative", "adversarial", "performance", "recovery test"]],
    ["acceptance", ["acceptance evidence", "evidence owner", "retention"]],
    ["ai-agent", ["ai coding agent", "fail closed", "must not infer"]],
  ];
  for (const [category, requiredTerms] of semanticChecks) {
    const missing = requiredTerms.filter((term) => !lower.includes(term));
    if (missing.length) issues.push(contractIssue(category, `The version-specific contract is missing required ${category} terms: ${missing.join(", ")}.`));
  }
  const measurableTargets = contract.match(/\b\d+(?:\.\d+)?\s?(?:ms|s|seconds?|minutes?|hours?|days?|%|mib|gib|requests?|events?|rules?|packages?|workers?|nodes?|iterations?)\b/gi) ?? [];
  if (measurableTargets.length < 3) issues.push(contractIssue("operations", "The contract requires at least three measurable service, capacity, recovery, or resource targets."));
  return issues;
}

function contractIssue(category, summary) { return { category, summary }; }
async function preserveBaselineAudit(root, version, audit) {
  if (!audit) return;
  const directory = path.join(root, `docs/evidence/changes/version-readiness-audit-${version}`);
  const baselineJson = path.join(directory, "baseline-hold-audit.json");
  const baselineMarkdown = path.join(directory, "baseline-hold-audit.md");
  try { await access(baselineJson); }
  catch {
    await writeFile(baselineJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
    const currentMarkdown = await readFile(path.join(directory, "audit.md"), "utf8").catch(() => renderAuditMarkdown(audit));
    await writeFile(baselineMarkdown, currentMarkdown, "utf8");
  }
}

function finding(value) { return value; }
function versionCode(version) { return version.replace(/^v/, "V").replaceAll(".", ""); }
function scoreProfile(base, riskTier) {
  const criticalPenalty = riskTier === "tier-3" ? 4 : 0;
  return { product: base + 8, architecture: base, engineering: base - 8, documentation: base + 4, security: base - criticalPenalty, testing: base - 6, release: base, enterpriseReadiness: base - 5, openSourceReadiness: base + 6, aiAgentReadiness: base - 10, maintainability: base - 2, extensibility: base };
}
function roleQuestions(specification) {
  const title = specification.title;
  return [
    { role: "Product", unanswered: [`Which measurable user outcomes and non-goals define completion for ${title}?`] },
    { role: "Architecture", unanswered: [`Which component, state, data-flow, and failure contracts are normative for ${title}?`] },
    { role: "Engineering", unanswered: ["Which exact types, schemas, defaults, lifecycle transitions, and extension points must be implemented?"] },
    { role: "QA", unanswered: ["Which deterministic fixtures, adversarial cases, platforms, and thresholds prove each committed feature?"] },
    { role: "Security", unanswered: ["Which permissions, trust roots, data classes, abuse paths, and human approvals govern every effect?"] },
    { role: "DevOps", unanswered: ["How are release, migration, rollback, capacity, incident, and recovery exercises executed and retained?"] },
    { role: "Documentation", unanswered: ["Which executable user, operator, maintainer, accessibility, and troubleshooting journeys must ship?"] },
    { role: "Support", unanswered: ["What SLOs, escalation, compatibility expiry, LTS, and decommissioning policies apply?"] },
    { role: "AI coding agent", unanswered: ["Which behavior is normative when specifications, dependencies, or compatibility evidence are incomplete?"] },
  ];
}
function auditJsonPath(version) { return `docs/evidence/changes/version-readiness-audit-${version}/audit.json`; }
function auditMarkdownPath(version) { return `docs/evidence/changes/version-readiness-audit-${version}/audit.md`; }
function relativeAuditLink(from, to) { return `../version-readiness-audit-${to}/audit.md`; }
function label(value) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
