import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { CAPABILITY_MATURITY, listCapabilities } from "./capabilities.js";
import { validateChangeReadinessScorecard } from "./change-readiness.js";
import { DOCUMENTATION_CLASSES, DOCUMENTATION_LIFECYCLE } from "./documentation-catalog.js";
import { validateDocumentationImpactReport } from "./documentation-impact.js";
import { validateDocumentationEvidenceBundle } from "./documentation-evidence.js";

const REQUIRED_DOCUMENTS = [
  "AGENTS.md",
  "docs/ENGINEERING_GOVERNANCE.md",
  "docs/strategy/PLATFORM_CONSTITUTION.md",
  "docs/strategy/FORGEVENA_PLATFORM_BLUEPRINT.md",
  "docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md",
  "docs/strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md",
  "docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md",
  "docs/architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md",
  "docs/architecture/ECOSYSTEM_CAPABILITY_AND_PACKAGE_MODEL.md",
  "docs/architecture/ENTERPRISE_CAPABILITY_SYSTEM.md",
  "docs/architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md",
  "docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md",
  "docs/architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md",
  "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md",
  "docs/strategy/FORGEHUB_PRODUCT_EXPERIENCE.md",
  "docs/developer/PUBLISHER_AND_ECOSYSTEM_SDK_STRATEGY.md",
  "docs/strategy/AI_ENGINEERING_OS_EVOLUTION.md",
  "docs/strategy/ECOSYSTEM_PRODUCT_AND_SUSTAINABILITY_STRATEGY.md",
  "docs/strategy/ECOSYSTEM_ADR_CANDIDATES.md",
  "docs/governance/FEATURE_PROPOSAL_TEMPLATE.md",
  "docs/governance/ADR_TEMPLATE.md",
  "docs/governance/THREAT_MODEL_TEMPLATE.md",
  "docs/governance/RELEASE_SCORECARD_TEMPLATE.md",
  "docs/governance/COMPATIBILITY_REPORT_TEMPLATE.md",
  "docs/governance/DEPRECATION_NOTICE_TEMPLATE.md",
  "docs/governance/POST_RELEASE_REVIEW_TEMPLATE.md",
  "docs/governance/waivers.json",
  "docs/governance/compatibility-evidence.json",
  "docs/governance/CHANGE_READINESS_SCORECARD.md",
  "docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md",
  "docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md",
  "docs/governance/DOCUMENTATION_IMPACT_REPORT_TEMPLATE.md",
  "docs/governance/DOCUMENTATION_AUTHORITY_MAP.md",
  "docs/strategy/RESEARCH_AND_STANDARDS_RADAR.md",
  "docs/reports/ENTERPRISE_DOCUMENTATION_AUDIT_REPORT.md",
  "docs/reference/schemas/change-readiness-scorecard.schema.json",
  "docs/reference/schemas/document-catalog.schema.json",
  "docs/reference/schemas/documentation-impact.schema.json",
  "docs/evidence/changes/README.md",
  "docs/reference/generated/documentation-catalog.json",
  "docs/reference/generated/documentation-health.json",
];

const TEMPLATE_REQUIREMENTS = {
  "docs/governance/FEATURE_PROPOSAL_TEMPLATE.md": ["Owner", "Evidence Funnel stage", "Intended maturity", "Review date", "Alternatives and Non-Goals", "Impact Assessment"],
  "docs/governance/ADR_TEMPLATE.md": ["Status", "Owners", "Context", "Decision", "Alternatives", "Consequences", "Evidence and Review"],
  "docs/governance/THREAT_MODEL_TEMPLATE.md": ["Trust Boundaries and Data Flows", "Threats and Controls", "Residual risk", "Validation"],
  "docs/governance/RELEASE_SCORECARD_TEMPLATE.md": ["Release owner", "Evidence", "Channel Verification", "Roadmap Reconciliation"],
  "docs/governance/COMPATIBILITY_REPORT_TEMPLATE.md": ["verification date", "evidence expiry", "Matrix", "Migration and Support"],
  "docs/governance/DEPRECATION_NOTICE_TEMPLATE.md": ["Owner", "Planned retirement", "Replacement", "Migration and Rollback"],
  "docs/governance/POST_RELEASE_REVIEW_TEMPLATE.md": ["Release Outcome", "Verification", "Variance and Learning", "Actions", "Decision"],
  "docs/governance/CHANGE_READINESS_SCORECARD.md": ["Push Ready", "Merge Ready", "Release Ready", "Mandatory Blockers", "Module Criticality Gates", "Profile-Specific Domain Gates", "Schema v2 Migration", "ForgeHub", "ForgeRegistry", "capability-package", "host-adapter-portability", "agent-team-runtime", "orchestration-automation"],
  "docs/governance/DOCUMENTATION_IMPACT_REPORT_TEMPLATE.md": ["Change Metadata", "Changed Surface", "Documentation Obligations", "Validation", "Decision"],
};

export async function validateGovernance(root, { now = new Date() } = {}) {
  const issues = [];
  for (const relative of REQUIRED_DOCUMENTS) {
    if (!(await exists(path.join(root, relative)))) issues.push(`${relative} is required by governance.`);
  }
  if (issues.length) return result(issues);

  const charter = await text(root, "AGENTS.md");
  const governance = await text(root, "docs/ENGINEERING_GOVERNANCE.md");
  const blueprint = await text(root, "docs/strategy/FORGEVENA_PLATFORM_BLUEPRINT.md");
  const roadmap = await text(root, "docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md");
  const portfolio = await text(root, "docs/strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md");
  requireText(issues, "AGENTS.md", charter, ["Platform Constitution", "Engineering Governance", "Never overwrite", "--dry-run", "default execution authority", "Do not skip, reorder, replace"]);
  requireText(issues, "docs/ENGINEERING_GOVERNANCE.md", governance, ["Evidence Funnel", "Definition of Ready", "Definition of Done", "Waivers", "Technical Debt", "Roadmap Authority and Change Control", "Emergency security or data-loss work", "roadmap reconciliation"]);
  requireText(issues, "docs/strategy/FORGEVENA_PLATFORM_BLUEPRINT.md", blueprint, ["Platform Constitution", "Open local platform", "collects no telemetry by default"]);
  requireText(issues, "docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md", roadmap, ["Evidence Funnel", "Innovation Opportunity Portfolio", "default execution authority", "Do not skip, reorder, replace", "emergency security or data-loss patch", "reconcile completed, deferred, rejected", "v1.4", "v2.0", "v2.1.0", "v2.7.0", "v3.0.0", "SourceAdapter", "AgentSpace", "recommendation-evidence"]);
  requireText(issues, "docs/strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md", portfolio, ["not committed release scope", "Trust Center and Evidence Graph", "Maintainer Sustainability System", "No telemetry", "Dynamic agent swarms", "Self-evolving capabilities", "Paid marketplace transactions"]);
  requireText(issues, "docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md", await text(root, "docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md"), ["not implementation authorization", "No account", "hidden ranking", "AgentSpace", "not a separate product pillar", "version-scoped", "Proposal Reconciliation", "Already covered", "Strengthened", "Newly documented", "Deferred", "Rejected"]);
  requireText(issues, "docs/architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md", await text(root, "docs/architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md"), ["deterministic dependency resolution", "Air-Gapped Operation", "not a marketplace"]);
  requireText(issues, "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md", await text(root, "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md"), ["dependency confusion", "revocation", "appeal"]);
  requireText(issues, "docs/strategy/AI_ENGINEERING_OS_EVOLUTION.md", await text(root, "docs/strategy/AI_ENGINEERING_OS_EVOLUTION.md"), ["Human Authority", "local-first", "v3.0"]);
  requireText(issues, "docs/architecture/ENTERPRISE_CAPABILITY_SYSTEM.md", await text(root, "docs/architecture/ENTERPRISE_CAPABILITY_SYSTEM.md"), ["Capability Definition", "Capability Package", "Capability Release", "Installation", "Configuration", "Activation", "Invocation or Run", "Evidence Record", "Intelligence and behavior", "Actions and connectivity", "Context and knowledge", "Orchestration and automation", "Experience and interfaces", "Delivery and development", "Governance and assurance", "Capability Studio", "Deny overrides allow", "unbounded autonomous loops"]);
  requireText(issues, "docs/architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md", await text(root, "docs/architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md"), ["HostAdapter", "loss report", "unsupported", "research target"]);
  requireText(issues, "docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md", await text(root, "docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md"), ["SourceAdapter", "HostAdapter", "Converter", "Quarantine", "manual-adaptation", "permission-delta", "not automatically a Forgevena capability", "source-adapter/v1", "conversion-report/v1", "workspace-scope/v1", "recommendation-evidence/v1"]);
  requireText(issues, "docs/architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md", await text(root, "docs/architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md"), ["Deterministic Foundation", "Bounded Execution", "deadlock", "Human Authority"]);
  requireText(issues, "docs/architecture/ECOSYSTEM_CAPABILITY_AND_PACKAGE_MODEL.md", await text(root, "docs/architecture/ECOSYSTEM_CAPABILITY_AND_PACKAGE_MODEL.md"), ["installation scopes", "deployment modes", "ambiguous precedence fails closed", "manual adaptation", "Capability types declare"]);
  requireText(issues, "docs/strategy/FORGEHUB_PRODUCT_EXPERIENCE.md", await text(root, "docs/strategy/FORGEHUB_PRODUCT_EXPERIENCE.md"), ["AgentSpace", "Information Architecture", "Explainable Recommendations", "not telemetry", "permission impact", "Source import"]);
  requireText(issues, "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md", await text(root, "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md"), ["independent dimensions", "must not collapse", "signature and provenance", "Popularity"]);

  for (const [relative, requirements] of Object.entries(TEMPLATE_REQUIREMENTS)) requireText(issues, relative, await text(root, relative), requirements);

  const waivers = await json(root, "docs/governance/waivers.json", issues);
  if (waivers) validateWaivers(waivers, now, issues);
  const evidence = await json(root, "docs/governance/compatibility-evidence.json", issues);
  if (evidence) validateCompatibilityEvidence(evidence, now, issues);
  await validateCapabilityClaims(root, evidence, now, issues);
  const scorecardsChecked = await validateRetainedScorecards(root, now, issues);
  const impactReportsChecked = await validateRetainedImpactReports(root, issues);
  const evidenceBundlesChecked = await validateRetainedDocumentationEvidence(root, issues);
  const documentsChecked = await validateDocumentationGovernance(root, now, issues);
  return result(issues, scorecardsChecked, documentsChecked, impactReportsChecked, evidenceBundlesChecked);
}

async function validateDocumentationGovernance(root, now, issues) {
  const standard = await text(root, "docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md");
  requireText(issues, "docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md", standard, ["Canonical policy", "Diátaxis", "arc42", "Historical records", "AI-Agent Readiness", "Standards Crosswalk", "100%", "95%", "90%"]);
  const synchronization = await text(root, "docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md");
  requireText(issues, "docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md", synchronization, ["Detect changed files", "Change impact evidence", "Documentation dependency graph", "Documentation bill of materials", "Executable example attestations", "Break-glass governance", "Human reviewers retain final authority"]);
  const radar = await text(root, "docs/strategy/RESEARCH_AND_STANDARDS_RADAR.md");
  requireText(issues, "docs/strategy/RESEARCH_AND_STANDARDS_RADAR.md", radar, ["not imply compliance", "Diátaxis", "ISO/IEC 25010:2023", "NIST SSDF", "NIST AI RMF", "OpenSSF OSPS Baseline", "SLSA", "Evidence Funnel"]);

  const catalog = await json(root, "docs/reference/generated/documentation-catalog.json", issues);
  if (!catalog) return 0;
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.documents) || catalog.documents.length === 0) {
    issues.push("Documentation catalog must use schemaVersion 1 and contain documents.");
    return 0;
  }
  const ids = new Set();
  const paths = new Set();
  const authorities = new Set();
  for (const document of catalog.documents) {
    for (const field of ["id", "path", "title", "classification", "contentType", "purpose", "owner", "lifecycle", "criticality", "lastVerified", "reviewBy"]) {
      if (!document?.[field]) issues.push(`Documentation catalog entry ${document?.path ?? "<unknown>"} is missing ${field}.`);
    }
    if (ids.has(document.id)) issues.push(`Documentation catalog duplicates ID ${document.id}.`);
    if (paths.has(document.path)) issues.push(`Documentation catalog duplicates path ${document.path}.`);
    ids.add(document.id);
    paths.add(document.path);
    if (!DOCUMENTATION_CLASSES.includes(document.classification)) issues.push(`Documentation ${document.path} has unsupported classification ${document.classification}.`);
    if (!DOCUMENTATION_LIFECYCLE.includes(document.lifecycle)) issues.push(`Documentation ${document.path} has unsupported lifecycle ${document.lifecycle}.`);
    for (const field of ["audiences", "reviewers", "versions", "related"]) if (!Array.isArray(document[field])) issues.push(`Documentation ${document.path} must define ${field} as an array.`);
    if (!document.relevance || ["security", "privacy", "accessibility", "regulatory", "operations", "aiAgents"].some((field) => typeof document.relevance[field] !== "boolean")) issues.push(`Documentation ${document.path} has incomplete relevance metadata.`);
    if (document.authority) {
      if (authorities.has(document.authority)) issues.push(`Documentation authority ${document.authority} is duplicated.`);
      authorities.add(document.authority);
    }
    if (document.classification === "historical-record" && (document.lifecycle !== "archived" || !document.replacement)) issues.push(`Historical document ${document.path} must be archived with current replacement guidance.`);
    if (document.lifecycle === "maintained") {
      const reviewBy = new Date(document.reviewBy);
      if (Number.isNaN(reviewBy.valueOf()) || reviewBy < now) issues.push(`Maintained document ${document.path} has an invalid or expired review deadline ${document.reviewBy}.`);
    }
  }

  const actualMarkdown = await findExtensionFiles(path.join(root, "docs"), ".md");
  for (const file of actualMarkdown) {
    const relativePath = path.relative(root, file).replaceAll("\\", "/");
    if (!paths.has(relativePath)) issues.push(`Documentation catalog is missing ${relativePath}.`);
  }
  for (const documentPath of paths) if (!(await exists(path.join(root, documentPath)))) issues.push(`Documentation catalog references missing file ${documentPath}.`);

  const health = await json(root, "docs/reference/generated/documentation-health.json", issues);
  if (health) {
    if (health.schemaVersion !== 1 || health.documentCount !== catalog.documents.length) issues.push("Documentation health evidence does not match the catalog.");
    if (health.decision !== "ready") issues.push(`Documentation health decision is ${health.decision}, expected ready.`);
    for (const domain of health.domains ?? []) if (domain.score < domain.required || domain.status !== "pass") issues.push(`Documentation health domain ${domain.id} does not satisfy its ${domain.required}% gate.`);
  }
  return catalog.documents.length;
}

async function validateRetainedScorecards(root, now, issues) {
  const evidenceRoot = path.join(root, "docs/evidence/changes");
  const scorecards = await findNamedFiles(evidenceRoot, "scorecard.json");
  if (scorecards.length === 0) issues.push("At least one retained change-readiness scorecard example is required.");
  for (const scorecardPath of scorecards) {
    const relative = path.relative(root, scorecardPath).replaceAll("\\", "/");
    let document;
    try { document = JSON.parse(await readFile(scorecardPath, "utf8")); }
    catch { issues.push(`${relative} is not valid JSON.`); continue; }
    const report = validateChangeReadinessScorecard(document, { now });
    for (const issue of report.issues) issues.push(`${relative}: ${issue}`);
    await validateScorecardEvidencePaths(root, relative, document, issues);
  }
  return scorecards.length;
}

async function validateRetainedImpactReports(root, issues) {
  const reports = await findNamedFiles(path.join(root, "docs/evidence/changes"), "documentation-impact.json");
  for (const reportPath of reports) {
    const relative = path.relative(root, reportPath).replaceAll("\\", "/");
    let document;
    try { document = JSON.parse(await readFile(reportPath, "utf8")); }
    catch { issues.push(`${relative} is not valid JSON.`); continue; }
    const validation = validateDocumentationImpactReport(document);
    for (const issue of validation.issues) issues.push(`${relative}: ${issue}`);
    if (document.decision !== "ready") issues.push(`${relative}: retained documentation impact decision must be ready.`);
  }
  return reports.length;
}

async function validateRetainedDocumentationEvidence(root, issues) {
  const manifests = await findNamedFiles(path.join(root, "docs/evidence/changes"), "evidence-manifest.json");
  for (const manifest of manifests) {
    const relative = path.relative(root, manifest).replaceAll("\\", "/");
    const validation = await validateDocumentationEvidenceBundle(path.dirname(manifest));
    for (const issue of validation.issues) issues.push(`${relative}: ${issue}`);
  }
  return manifests.length;
}

async function validateScorecardEvidencePaths(root, relative, document, issues) {
  const references = [
    ...(document.evidenceLinks ?? []),
    ...(document.categories ?? []).flatMap((category) => [
      ...(category.evidence ?? []),
      ...(category.items ?? []).flatMap((item) => item.evidence ?? []),
    ]),
    ...(document.blockers ?? []).flatMap((blocker) => blocker.evidence ?? []),
  ];
  for (const reference of new Set(references)) {
    if (typeof reference !== "string" || /^[a-z][a-z0-9+.-]*:/i.test(reference) || reference.startsWith("#")) continue;
    const withoutAnchor = reference.split("#", 1)[0].replace(/:\d+(?::\d+)?$/, "");
    if (!withoutAnchor || path.isAbsolute(withoutAnchor) || withoutAnchor.includes("..")) {
      issues.push(`${relative}: evidence must use a repository-relative safe path: ${reference}.`);
    } else if (!(await exists(path.join(root, withoutAnchor)))) {
      issues.push(`${relative}: evidence path does not exist: ${reference}.`);
    }
  }
}

function validateWaivers(document, now, issues) {
  if (document.schemaVersion !== 1 || !Array.isArray(document.waivers)) return issues.push("docs/governance/waivers.json must use schemaVersion 1 and a waivers array.");
  for (const waiver of document.waivers) {
    for (const field of ["id", "owner", "requirement", "justification", "risk", "compensatingControls", "approvedBy", "createdAt", "expiresAt", "remediationIssue"]) {
      if (!waiver[field] || (Array.isArray(waiver[field]) && waiver[field].length === 0)) issues.push(`Waiver ${waiver.id ?? "<unknown>"} is missing ${field}.`);
    }
    const expiry = new Date(waiver.expiresAt);
    if (Number.isNaN(expiry.valueOf())) issues.push(`Waiver ${waiver.id ?? "<unknown>"} has an invalid expiresAt date.`);
    else if (expiry <= now) issues.push(`Waiver ${waiver.id} expired on ${waiver.expiresAt}.`);
  }
}

function validateCompatibilityEvidence(document, now, issues) {
  if (document.schemaVersion !== 1 || !Number.isInteger(document.maximumAgeDays) || document.maximumAgeDays < 1 || !Array.isArray(document.records)) {
    return issues.push("docs/governance/compatibility-evidence.json must define schemaVersion 1, positive maximumAgeDays, and records.");
  }
  for (const record of document.records) {
    for (const field of ["id", "component", "owner", "verifiedAt", "evidence"]) if (!record[field]) issues.push(`Compatibility record ${record.id ?? "<unknown>"} is missing ${field}.`);
    const verifiedAt = new Date(record.verifiedAt);
    if (Number.isNaN(verifiedAt.valueOf())) issues.push(`Compatibility record ${record.id ?? "<unknown>"} has an invalid verifiedAt date.`);
    else if ((now - verifiedAt) / 86_400_000 > document.maximumAgeDays) issues.push(`Compatibility record ${record.id} is stale; verified ${record.verifiedAt}.`);
  }
}

async function validateCapabilityClaims(root, evidenceDocument, now, issues) {
  for (const capability of listCapabilities()) {
    if (!CAPABILITY_MATURITY.includes(capability.maturity)) issues.push(`Capability ${capability.name} has unsupported maturity ${capability.maturity}.`);
    if (!capability.support) issues.push(`Capability ${capability.name} is missing support metadata.`);
    if (!capability.evidence) issues.push(`Capability ${capability.name} is missing evidence metadata.`);
    else if (!(await exists(path.join(root, capability.evidence)))) issues.push(`Capability ${capability.name} references missing evidence ${capability.evidence}.`);
    if (capability.maturity === "enterprise-certified") {
      const certification = evidenceDocument?.records?.find((record) => record.component === capability.name && record.maturity === "enterprise-certified" && record.status === "pass");
      const verifiedAt = certification ? new Date(certification.verifiedAt) : null;
      const fresh = verifiedAt && !Number.isNaN(verifiedAt.valueOf()) && (now - verifiedAt) / 86_400_000 <= evidenceDocument.maximumAgeDays;
      if (!certification || !fresh) issues.push(`Capability ${capability.name} cannot claim enterprise-certified without a current passing machine-readable certification record.`);
    }
  }
}

function requireText(issues, relative, contents, requirements) {
  for (const requirement of requirements) if (!contents.toLowerCase().includes(requirement.toLowerCase())) issues.push(`${relative} is missing required governance metadata: ${requirement}.`);
}

async function text(root, relative) { return readFile(path.join(root, relative), "utf8"); }
async function json(root, relative, issues) {
  try { return JSON.parse(await text(root, relative)); }
  catch { issues.push(`${relative} is not valid JSON.`); return null; }
}
async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function findNamedFiles(directory, name) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await findNamedFiles(target, name));
    else if (entry.isFile() && entry.name === name) found.push(target);
  }
  return found.sort();
}
async function findExtensionFiles(directory, extension) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await findExtensionFiles(target, extension));
    else if (entry.isFile() && entry.name.endsWith(extension)) found.push(target);
  }
  return found.sort();
}
function result(issues, scorecardsChecked = 0, documentationRecordsChecked = 0, impactReportsChecked = 0, evidenceBundlesChecked = 0) { return { valid: issues.length === 0, issues, checkedDocuments: REQUIRED_DOCUMENTS.length, scorecardsChecked, documentationRecordsChecked, impactReportsChecked, evidenceBundlesChecked, maturityVocabulary: [...CAPABILITY_MATURITY] }; }
