import { readFile } from "node:fs/promises";
import path from "node:path";
import { AUDITED_VERSIONS, normalizeGeneratedMarkdown, writeGeneratedFile } from "../src/version-readiness-audit.js";

const requestedVersion = valueAfter("--version");
if (requestedVersion && !AUDITED_VERSIONS.includes(requestedVersion)) throw new Error(`Unknown future version ${requestedVersion}.`);
const versions = requestedVersion ? [requestedVersion] : AUDITED_VERSIONS;
const apply = process.argv.includes("--apply");
const audits = [];

for (const version of versions) {
  const directory = path.join("docs", "evidence", "changes", `version-readiness-audit-${version}`);
  const audit = JSON.parse(await readFile(path.join(directory, "audit.json"), "utf8"));
  const plan = renderVersionPlan(audit);
  const target = path.join(directory, "remediation-plan.md");
  if (apply) {
    await writeGeneratedFile(target, plan);
  } else if (normalizeGeneratedMarkdown(await readFile(target, "utf8").catch(() => "")) !== normalizeGeneratedMarkdown(plan)) {
    throw new Error(`${target} is missing or stale; run with --apply`);
  }
  audits.push(audit);
}

const writeComparison = !requestedVersion;
if (writeComparison) {
  const comparisonTarget = path.join("docs", "reports", "VERSION_IMPLEMENTATION_READINESS_REMEDIATION_PLAN.md");
  const comparison = renderCrossVersionPlan(audits);
  if (apply) await writeGeneratedFile(comparisonTarget, comparison);
  else if (normalizeGeneratedMarkdown(await readFile(comparisonTarget, "utf8").catch(() => "")) !== normalizeGeneratedMarkdown(comparison)) throw new Error(`${comparisonTarget} is missing or stale; run with --apply`);
}

console.log(JSON.stringify({ valid: true, mode: apply ? "write" : "verify", versions: versions.length, blockingFindings: audits.reduce((total, audit) => total + audit.findings.filter((finding) => finding.blocking).length, 0), files: versions.length + (writeComparison ? 1 : 0) }, null, 2));

function renderVersionPlan(audit) {
  const findings = audit.findings.filter((finding) => finding.blocking);
  const targetScore = 95;
  const lines = [
    `# ${audit.auditedVersion} Implementation Readiness Remediation Plan`,
    "",
    `**Current verdict:** \`${audit.verdict.toUpperCase()}\`  `,
    `**Current score:** ${audit.overallScore}/100  `,
    `**Target score:** at least ${targetScore}/100 with every mandatory module passing  `,
    `**Blocking findings:** ${findings.length}`,
    "",
    "## Purpose",
    "",
    "This plan converts every blocking audit finding into decision-complete documentation and engineering preparation work. It does not approve a product decision, modify the version specification, or authorize implementation. A finding closes only after the accountable owner approves the required artifact and a new independent audit verifies the evidence.",
    "",
    "## Exit Conditions",
    "",
    "- Every blocking question has one approved canonical answer.",
    "- Critical security, trust, permissions, data-flow, contract, migration, rollback, and human-authority controls score 100%.",
    "- Important architecture, interface, operations, accessibility, and release controls score at least 95%.",
    "- The normalized overall score is at least 95/100.",
    "- No implementation-affecting open question, roadmap contradiction, unsupported assumption, or unowned risk remains.",
    "- The refreshed audit verdict is `APPROVE` before implementation begins.",
    "",
    "## Remediation Order",
    "",
    "Resolve roadmap authority and product scope first, then architecture and trust boundaries, then public contracts and data models, then migration and operations, and finally executable test and release evidence. Downstream work must not use a proposed default as an approved decision.",
    "",
  ];
  findings.forEach((finding, index) => lines.push(...renderFinding(finding, index + 1, targetScore)));
  lines.push(...renderVersionChecklist(findings, targetScore));
  return `${lines.join("\n")}\n`;
}

function renderFinding(finding, index, targetScore) {
  const priority = finding.severity === "critical" ? "Critical" : finding.severity === "high" ? "High" : "Medium";
  const sections = missingSections(finding.category);
  return [
    `## ${index}. ${finding.id}: ${finding.summary}`,
    "",
    `**Priority:** ${priority}  `,
    `**Domain:** ${finding.category}  `,
    `**Affected features:** ${finding.affectedFeatures.map((feature) => `\`${feature}\``).join(", ")}  `,
    `**Dependency:** ${finding.dependency}`,
    "",
    `### Why This Blocks Implementation — ${finding.id}`,
    "",
    `${finding.question} ${finding.impact} Implementing before this decision is approved would force engineers or coding agents to invent behavior that should be governed and interoperable.`,
    "",
    `### Documents to Update — ${finding.id}`,
    "",
    `- **Primary target:** \`${finding.targetDocument}\``,
    `- **Finding source:** \`${finding.sourceReference}\``,
    `- **Required approval artifact:** ${finding.requiredArtifact}`,
    "- **Traceability updates:** the version README, feature record, interface or architecture index, evidence requirements, and dependency map where affected.",
    "",
    `### Missing Sections — ${finding.id}`,
    "",
    ...sections.map((section) => `- ${section}`),
    "",
    `### Proposed Required Content — ${finding.id}`,
    "",
    `${finding.remediation} The document must distinguish normative requirements from recommendations, name the accountable owner, record rejected alternatives, state compatibility and rollback consequences, and link objective acceptance evidence.`,
    "",
    `### Implementation Effect — ${finding.id}`,
    "",
    `Once approved, this decision becomes an input to architecture decomposition, contract and schema work, implementation tasks, negative-path tests, migration or rollback procedures, and release evidence. Until then, work depending on ${finding.dependency} remains blocked.`,
    "",
    `### Risk if Unresolved — ${finding.id}`,
    "",
    `**${priority} risk.** ${finding.impact} The likely result is incompatible implementations, unsafe defaults, late redesign, untestable acceptance criteria, or a release that cannot satisfy enterprise gates.`,
    "",
    `### Documentation Remediation Checklist — ${finding.id}`,
    "",
    `- [ ] Create or update \`${finding.targetDocument}\` under the canonical version package.`,
    ...sections.map((section) => `- [ ] Add and approve the **${section}** section.`),
    `- [ ] Answer the blocking question explicitly: ${finding.question}`,
    `- [ ] Cross-link \`${finding.sourceReference}\`, affected feature records, foundation authorities, and evidence requirements.`,
    "- [ ] Record owner, reviewers, approval state, review date, assumptions, rejected alternatives, and decision expiry where applicable.",
    "- [ ] Validate terminology, links, diagrams, schemas, examples, and roadmap dependency consistency.",
    "",
    `### Engineering Remediation Checklist — ${finding.id}`,
    "",
    "- [ ] Keep dependent implementation tasks in `blocked` state until the document is approved.",
    "- [ ] Convert every normative statement into owned architecture, interface, schema, implementation, test, migration, rollback, and operations tasks.",
    "- [ ] Define positive, negative, adversarial, failure-injection, compatibility, and recovery test cases where applicable.",
    "- [ ] Identify feature flags, kill switches, observability, support ownership, and safe fallback behavior.",
    "- [ ] Confirm no implementation task broadens authority, permissions, data use, network effects, billing, or mutation beyond the approved decision.",
    "- [ ] Link pull requests and retained evidence back to the finding ID.",
    "",
    `### Finding Readiness Checklist — ${finding.id}`,
    "",
    "- [ ] The unanswered question has one unambiguous, approved answer.",
    "- [ ] Required artifact exists and is approved by the accountable owner and mandatory reviewers.",
    "- [ ] All downstream dependencies and affected interfaces are updated consistently.",
    `- [ ] Acceptance evidence is objective and executable: ${finding.acceptanceEvidence}`,
    "- [ ] No contradictory canonical statement or unsupported maturity claim remains.",
    `- [ ] Re-audit confirms this finding is closed and the version remains capable of reaching at least ${targetScore}/100.`,
    "",
  ];
}

function missingSections(category) {
  const common = ["Decision and scope", "Normative requirements and invariants", "Failure modes and recovery", "Compatibility, migration, and rollback", "Validation and acceptance evidence"];
  const specific = {
    "product-and-compatibility": ["Supported personas and use cases", "Capability qualification matrix", "Promotion, demotion, and deprecation policy", "Support ownership and evidence freshness"],
    compatibility: ["Evidence sources and timestamps", "Freshness service level", "Expiry and fail-closed behavior", "Revalidation and exception workflow"],
    "api-contracts": ["Versioned type and method contract", "Input, output, stream, tool, and error schemas", "Capability negotiation", "Compatibility and conformance fixtures"],
    reliability: ["Operation classification", "Retry and backoff rules", "Idempotency and cancellation", "Fallback, budgets, and circuit breaking", "Failure-state matrix"],
    "security-and-privacy": ["Assets and trust boundaries", "Data classification and flow", "Threat and abuse cases", "Redaction, retention, deletion, and consent", "Security verification"],
    "provider-behavior": ["Provider capability profile", "Authentication and endpoint behavior", "Rate limits and normalized errors", "Model discovery and compatibility", "Provider-specific fixtures"],
    configuration: ["Versioned configuration schema", "Defaults and precedence", "Validation and secret references", "Migration and unknown-field behavior"],
    "cli-dashboard-sdk": ["Surface inventory", "Commands, states, and user journeys", "Structured output and stable errors", "Accessibility and consent behavior", "Cross-surface parity"],
    testing: ["Test matrix", "Fixtures and golden contracts", "Negative and adversarial cases", "Platform and compatibility coverage", "Pass, fail, and expiry criteria"],
    "migration-and-rollback": ["Source and target inventory", "Preflight and backups", "Ordered migration state machine", "Partial failure and recovery", "Rollback, roll-forward, and support window"],
    "operations-performance": ["Service-level objectives and error budgets", "Reference workloads and capacity", "Metrics, alerts, and diagnostics", "Incident, escalation, and support model", "Cost and degraded-mode policy"],
    "roadmap-authority": ["Canonical scope reconciliation", "Committed, deferred, and prohibited behavior", "Dependency-order impact", "Approval and regenerated package evidence"],
    "sandbox-security": ["Threat model and attacker capabilities", "Operating-system isolation matrix", "Resource and system-call boundaries", "Escape, crash, and termination behavior", "Residual risk and unsupported platforms"],
    "rpc-contract": ["Transport framing and handshake", "Methods, events, and schemas", "Cancellation, progress, and backpressure", "Errors, timeouts, and shutdown", "Version negotiation and golden transcripts"],
    permissions: ["Permission vocabulary", "Request, grant, denial, and revocation flow", "Filesystem, network, process, and provider mediation", "Policy and consent interaction", "Audit and bypass tests"],
    "trust-and-signing": ["Trust roots and publisher identity", "Signature and provenance verification", "Key rotation, compromise, and revocation", "Offline and air-gapped trust", "Exceptions and recovery"],
    "lifecycle-and-state": ["Lifecycle state machine", "Ownership and persisted state", "Update, rollback, remove, and recovery", "Crash and concurrency behavior", "Audit events and invariants"],
    portability: ["Compatibility outcome definitions", "Capability negotiation", "Translation and permission deltas", "Loss report contract", "Unsupported and manual-adaptation behavior"],
    "mcp-contract": ["Transport and authentication profiles", "Capability and permission contract", "Session, timeout, and health behavior", "Data flow and trust boundaries", "Compatibility fixtures"],
    "dependency-resolution": ["Identity and version constraints", "Peer, optional, and conflicting dependencies", "Cycle and conflict handling", "Deterministic lock and update behavior", "Rollback and offline resolution"],
    "migration-and-compatibility": ["Legacy inventory and compatibility matrix", "State and manifest transformations", "Dual-read and rollback strategy", "Unsupported cases and user guidance", "Migration fixtures"],
    "governance-promotion": ["Discovery evidence", "RFC, ADR, and threat-model approvals", "Evidence Funnel transition record", "Scope and ownership approval", "Rejection and rollback criteria"],
    "major-version-contracts": ["Breaking-contract inventory", "Compatibility and deprecation map", "Migration ownership", "Final 2.x support policy", "Consumer verification"],
    "ecosystem-governance": ["Decision rights and responsibility assignment", "Namespace and trust-root governance", "Moderation, appeals, and emergency action", "Publisher recovery and succession", "Transparency and community representation"],
    "dependency-contracts": ["Pinned contract versions", "Assumption and maturity ledger", "Dependency acceptance evidence", "Failure and downgrade boundaries", "Replacement and expiry policy"],
    architecture: ["System context and authority map", "Component responsibilities", "Control and data flows", "Trust and failure boundaries", "Deployment and evolution constraints"],
    "data-and-privacy": ["Canonical data model", "Classification, lineage, and provenance", "Retention, deletion, residency, and export", "Access control and consent", "Integrity and privacy tests"],
    "human-authority": ["State machine and approval gates", "Human-only decisions", "Preview, consent, and promotion authority", "Kill switch and recovery", "Audit and anti-bypass evidence"],
    "federation-and-control-plane": ["Consistency and conflict model", "Offline and partition behavior", "Replication, ordering, and idempotency", "Trust, residency, and tenant isolation", "Recovery and continuity"],
    "public-interfaces": ["Interface inventory and ownership", "Versioned CLI, API, SDK, UI, and IDE contracts", "Authentication and stable errors", "Accessibility and compatibility", "Deprecation and conformance tests"],
    "reliability-operations": ["Availability and durability objectives", "Capacity and performance model", "Backup and disaster recovery", "Incident and support organization", "Cost, regions, and degraded operation"],
    "testing-and-certification": ["Validation work streams", "Environment and fixture matrix", "Security, privacy, accessibility, and resilience programs", "Certification limitations and expiry", "Release-candidate acceptance"],
    "scope-and-delivery": ["Capability decomposition", "Ownership and dependency graph", "Interface and data boundaries", "Incremental delivery and feature flags", "Per-capability acceptance evidence"],
  };
  return [...(specific[category] ?? []), ...common].filter((section, index, all) => all.indexOf(section) === index);
}

function renderVersionChecklist(findings, targetScore) {
  return [
    "## Version Readiness Checklist",
    "",
    "### Documentation",
    "",
    `- [ ] All ${findings.length} blocking findings have approved target documents and closed questions.`,
    "- [ ] Requirements, architecture, interfaces, security, testing, migration, operations, and evidence are traceable for every committed feature.",
    "- [ ] No candidate, deferred, or opportunity item is represented as committed without promotion evidence.",
    "- [ ] All documents have owners, reviewers, lifecycle state, review dates, and canonical links.",
    "",
    "### Engineering Preparation",
    "",
    "- [ ] Architecture decomposition and contract schemas can be implemented without inventing behavior.",
    "- [ ] Test matrices include deterministic fixtures, negative paths, failure injection, compatibility, migration, and rollback.",
    "- [ ] Security, privacy, permission, data-flow, and human-authority boundaries are threat-modeled and approved.",
    "- [ ] Operations define service objectives, observability, incidents, support, capacity, cost, backup, and recovery.",
    "",
    "### Governance Decision",
    "",
    "- [ ] Every explicit `openQuestions` entry is resolved or formally removed through approval.",
    "- [ ] All critical modules score 100%; all important modules score at least 95%; standard controls score at least 90%.",
    `- [ ] Overall implementation-readiness score is at least ${targetScore}/100.`,
    "- [ ] Independent re-audit returns `APPROVE` and records no mandatory blocker.",
    "- [ ] Only after approval may the version enter implementation.",
  ];
}

function renderCrossVersionPlan(audits) {
  const rows = audits.map((audit) => `| ${audit.auditedVersion} | ${audit.overallScore}/100 | ${audit.findings.filter((finding) => finding.blocking).length} | \`${audit.verdict.toUpperCase()}\` | [Plan](../evidence/changes/version-readiness-audit-${audit.auditedVersion}/remediation-plan.md) |`);
  return `# Version Implementation Readiness Remediation Program

## Executive Decision

Implementation remains blocked for every audited version that has owned or inherited blockers. The objective is not to increase the arithmetic score alone; it is to close every mandatory decision and then independently demonstrate a score of at least 95/100 with critical modules at 100%.

| Version | Current score | Blocking findings | Verdict | Detailed remediation |
| --- | ---: | ---: | --- | --- |
${rows.join("\n")}

## Dependency-Aware Sequence

${audits.map((audit, index) => `${index + 1}. **Remediate and independently re-audit ${audit.auditedVersion}.** Close ${audit.findings.filter((finding) => finding.blocking).length} owned blockers and ${audit.inheritedDependencyBlockers.length} inherited dependency blockers before activating implementation or the next roadmap version.`).join("\n")}
${audits.length + 1}. **Run the final cross-version audit.** Confirm no remediation creates contradictions, unsupported assumptions, duplicate authority, or dependency-order drift.

## Program Controls

- Every remediation item has one accountable owner and one canonical target document.
- Proposed defaults remain recommendations until RFC, ADR, threat-model, policy, or roadmap approval is recorded.
- Critical findings cannot be waived through score normalization.
- Documentation approval precedes implementation task activation.
- Evidence must be retained, dated, reproducible, and linked to the finding ID.
- Re-audits must be independent from the author approving the remediation.

## Program Completion Checklist

${audits.map((audit) => `- [ ] ${audit.auditedVersion} independently reaches at least 95/100 and \`APPROVE\` after its predecessor.`).join("\n")}
- [ ] Every critical control scores 100% and every important control scores at least 95%.
- [ ] No implementation-affecting open question, roadmap contradiction, unowned risk, fabricated evidence, or unsupported maturity claim remains.
- [ ] The cross-version dependency and compatibility review passes without exception.
`;
}

function valueAfter(option) {
  const index = process.argv.indexOf(option);
  return index === -1 ? undefined : process.argv[index + 1];
}
