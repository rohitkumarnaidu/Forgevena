import path from "node:path";

export const DOCUMENTATION_IMPACT_SCHEMA_VERSION = 2;

const ROOT_DOCUMENTS = new Set([
  "README.md", "CHANGELOG.md", "SECURITY.md", "SUPPORTED_VERSIONS.md",
  "CONTRIBUTING.md", "GOVERNANCE.md", "ROADMAP.md", "RELEASE.md", "AGENTS.md",
]);

const RULES = [
  rule("cli", ["bin/", "src/cli", "src/cli.js"], [
    obligation("cli-user-reference", "important", ["docs/cli/reference.md", "README.md"]),
    obligation("cli-generated-reference", "important", ["docs/reference/generated/cli.md"]),
  ]),
  rule("api-and-contracts", ["src/capabilities.js", "src/modules.js", "src/version.js", "docs/reference/schemas/"], [
    obligation("contract-reference", "critical", ["docs/api/", "docs/schemas/index.md", "docs/reference/generated/"]),
  ]),
  rule("state-and-recovery", ["src/state-", "src/upgrade.js", "src/registry"], [
    obligation("state-architecture", "critical", ["docs/architecture/enterprise-foundation.md"]),
    obligation("state-migration-recovery", "critical", ["docs/migration/", "docs/runbooks/"]),
  ]),
  rule("configuration", ["src/config.js", "src/config-transfer.js", "src/state-documents.js"], [
    obligation("configuration-reference", "important", ["docs/configuration/"]),
  ]),
  rule("credentials-and-vault", ["src/credentials.js", "src/secret-prompt.js"], [
    obligation("credential-security", "critical", ["docs/security/guide.md"]),
    obligation("credential-operations", "important", ["docs/configuration/reference.md", "docs/runbooks/"]),
  ]),
  rule("security-privacy-and-trust", ["src/consent.js", "src/org-policy.js", "src/logging.js", "src/supply-chain.js"], [
    obligation("security-privacy-guidance", "critical", ["docs/security/", "SECURITY.md"]),
  ]),
  rule("providers", ["src/provider", "src/providers.js"], [
    obligation("provider-contract", "critical", ["docs/providers/adapter-contract.md", "docs/providers/reference.md"]),
    obligation("provider-generated-reference", "important", ["docs/reference/generated/providers.md"]),
  ]),
  rule("plugins-and-mcp", ["src/plugins.js", "src/plugin-runtime.js", "src/mcp.js"], [
    obligation("plugin-mcp-guidance", "important", ["docs/plugins/guide.md", "docs/plugins/runtime.md", "docs/integrations/reference.md"]),
    obligation("plugin-mcp-threat-model", "critical", ["docs/security/THREAT_MODEL.md", "docs/security/"]),
  ]),
  rule("templates-and-bootstrap", ["src/template", "src/templates.js", "src/project.js", "src/bootstrap"], [
    obligation("template-bootstrap-guidance", "important", ["docs/templates/", "docs/bootstrap/"]),
    obligation("template-bootstrap-testing", "important", ["docs/testing/guide.md"]),
  ]),
  rule("cloud-infrastructure-and-deployment", ["src/cloud", "src/render.js", "src/docker.js", "Dockerfile", "docker-compose", ".github/workflows/"], [
    obligation("deployment-guidance", "important", ["docs/deployment/", "docs/release/"]),
    obligation("operations-and-rollback", "critical", ["docs/operations/", "docs/runbooks/"]),
  ]),
  rule("build-testing-and-dependencies", ["package-lock.json", "scripts/run-tests.js", "scripts/build-", ".github/workflows/ci", ".github/workflows/package", ".github/workflows/docs"], [
    obligation("testing-build-guidance", "important", ["docs/testing/", "docs/release/"]),
  ]),
  rule("governance-and-policy", ["src/governance", "src/org-policy.js", "src/change-readiness.js", "src/documentation-"], [
    obligation("engineering-governance", "critical", ["docs/ENGINEERING_GOVERNANCE.md"]),
    obligation("documentation-governance", "critical", ["docs/governance/"]),
    obligation("constitutional-alignment", "critical", ["docs/strategy/PLATFORM_CONSTITUTION.md"]),
  ]),
  rule("ai-and-engineering-intelligence", ["src/engineering-", "src/project-index.js", "src/semantic-index.js", "src/workflow-engine.js"], [
    obligation("ai-capability-guidance", "important", ["docs/capabilities/"]),
    obligation("ai-architecture-security", "critical", ["docs/security/", "docs/architecture/"]),
  ]),
  rule("observability-and-operations", ["src/diagnostics.js", "src/ecosystem-health.js", "src/logging.js"], [
    obligation("observability-operations", "important", ["docs/operations/", "docs/runbooks/"]),
  ]),
  rule("dashboard-ui-ux-accessibility", ["src/dashboard.js", "website/overrides/", "website/docs/"], [
    obligation("dashboard-user-guidance", "important", ["docs/website/", "docs/operations/"]),
    obligation("accessibility-evidence", "critical", ["docs/reports/ACCESSIBILITY_REPORT.md"]),
  ]),
  rule("public-contract", ["src/capabilities.js", "src/modules.js", "src/version.js", "package.json", "VERSION"], [
    obligation("public-generated-reference", "important", ["docs/reference/generated/"]),
    obligation("public-product-guidance", "important", ["README.md", "docs/ROADMAP.md"]),
  ]),
  rule("release-version-and-distribution", [".github/workflows/release", ".github/workflows/publish", "scripts/generate-distribution", "scripts/verify-release", "CHANGELOG.md", "VERSION"], [
    obligation("release-history", "critical", ["CHANGELOG.md", "docs/releases/", "docs/release/RELEASE_HISTORY.md"]),
    obligation("release-operations", "critical", ["RELEASE.md", "docs/release/PACKAGE_PUBLISHING.md", "docs/release/RELEASE_STRATEGY.md"]),
  ]),
  rule("open-source-governance", ["README.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "SUPPORTED_VERSIONS.md", "MAINTAINERS.md", "GOVERNANCE.md", "NOTICE", "LICENSE"], [
    obligation("open-source-governance", "important", ["README.md", "CONTRIBUTING.md", "SECURITY.md", "GOVERNANCE.md"]),
  ]),
];

export function analyzeDocumentationImpact(changedFiles, options = {}) {
  const files = [...new Set((changedFiles ?? []).map(normalize).filter(Boolean))].sort();
  const documentationFiles = files.filter(isDocumentation);
  const testFiles = files.filter((file) => file.startsWith("test/"));
  const implementationFiles = files.filter(isImplementation);
  const ruleFiles = files.filter((file) => !file.startsWith("test/") && !isGeneratedSite(file));
  const matchedRules = RULES.filter((candidate) => candidate.matches(ruleFiles));
  const components = [...new Set(matchedRules.map((candidate) => candidate.id))].sort();
  const requirements = matchedRules.flatMap((candidate) => candidate.obligations.map((item) => requirement(candidate, item, documentationFiles, options.notApplicable)));

  if (implementationFiles.length > 0) {
    requirements.push(couplingRequirement("implementation-documentation-coupling", "critical", "Implementation changes require documentation in the same change.", ["docs/", ...ROOT_DOCUMENTS], documentationFiles));
    requirements.push(couplingRequirement("implementation-test-coupling", "important", "Implementation changes require executable validation or a governed not-applicable rationale.", ["test/"], testFiles, options.notApplicable));
  }

  const uniqueRequirements = deduplicateRequirements(requirements);
  const blockers = uniqueRequirements.filter((item) => item.mandatory && !["pass", "not-applicable"].includes(item.status)).map((item) => item.id);
  return {
    schemaVersion: DOCUMENTATION_IMPACT_SCHEMA_VERSION,
    changeId: options.changeId ?? "unassigned",
    title: options.title ?? "Documentation impact analysis",
    owner: options.owner ?? "maintainers",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    checkpoint: options.checkpoint ?? "push",
    comparison: { base: options.base ?? null, head: options.head ?? null },
    changedFiles: files,
    changeProfile: implementationFiles.length ? "implementation" : documentationFiles.length ? "documentation" : "repository-metadata",
    affectedComponents: components,
    implementationFiles,
    documentationFiles,
    testFiles,
    requirements: uniqueRequirements,
    blockers,
    decision: blockers.length === 0 ? "ready" : "hold",
  };
}

export function validateDocumentationImpactReport(report) {
  const issues = [];
  if (!report || typeof report !== "object" || Array.isArray(report)) return { valid: false, issues: ["Impact report must be an object."] };
  if (report.schemaVersion !== DOCUMENTATION_IMPACT_SCHEMA_VERSION) issues.push(`schemaVersion must be ${DOCUMENTATION_IMPACT_SCHEMA_VERSION}.`);
  for (const field of ["changeId", "title", "owner", "generatedAt", "changeProfile", "checkpoint", "decision"]) if (typeof report[field] !== "string" || !report[field].trim()) issues.push(`${field} is required.`);
  for (const field of ["changedFiles", "affectedComponents", "implementationFiles", "documentationFiles", "testFiles", "requirements", "blockers"]) if (!Array.isArray(report[field])) issues.push(`${field} must be an array.`);
  if (report.generatedAt && Number.isNaN(new Date(report.generatedAt).valueOf())) issues.push("generatedAt must be an ISO-compatible timestamp.");
  if (!["push", "merge", "release"].includes(report.checkpoint)) issues.push("checkpoint must be push, merge, or release.");
  if (!["ready", "hold"].includes(report.decision)) issues.push("decision must be ready or hold.");
  const ids = new Set();
  for (const item of report.requirements ?? []) {
    if (!item?.id || ids.has(item.id)) issues.push(`Requirement ${item?.id ?? "<unknown>"} must have a unique ID.`);
    ids.add(item?.id);
    if (!["critical", "important", "standard"].includes(item?.criticality)) issues.push(`Requirement ${item?.id ?? "<unknown>"} has invalid criticality.`);
    if (!["pass", "fail", "not-applicable"].includes(item?.status)) issues.push(`Requirement ${item?.id ?? "<unknown>"} has invalid status.`);
    if (item?.status === "not-applicable" && !item?.rationale?.trim()) issues.push(`Requirement ${item.id} needs a not-applicable rationale.`);
    if (item?.mandatory && item?.status === "fail" && !(report.blockers ?? []).includes(item.id)) issues.push(`Mandatory requirement ${item.id} must be a blocker.`);
  }
  const expectedDecision = (report.blockers ?? []).length === 0 ? "ready" : "hold";
  if (report.decision !== expectedDecision) issues.push(`decision must be ${expectedDecision} for the recorded blockers.`);
  return { valid: issues.length === 0, issues };
}

export function renderDocumentationImpactMarkdown(report) {
  const rows = report.requirements.map((item) => `| \`${item.id}\` | ${item.criticality} | ${item.status} | ${item.matchedDocuments.map((value) => `\`${value}\``).join(", ") || item.rationale || "None"} |`).join("\n");
  return `# Documentation Impact Report\n\n- **Change:** \`${report.changeId}\`\n- **Owner:** ${report.owner}\n- **Checkpoint:** \`${report.checkpoint}\`\n- **Profile:** \`${report.changeProfile}\`\n- **Decision:** **${report.decision.toUpperCase()}**\n- **Generated:** ${report.generatedAt}\n\n## Affected Components\n\n${report.affectedComponents.map((value) => `- \`${value}\``).join("\n") || "- None detected"}\n\n## Requirements\n\n| Requirement | Criticality | Status | Updated evidence or rationale |\n|---|---|---|---|\n${rows || "| `documentation-only` | standard | pass | Documentation-only change |"}\n\n## Changed Documentation\n\n${report.documentationFiles.map((value) => `- \`${value}\``).join("\n") || "- None"}\n\n## Blockers\n\n${report.blockers.map((value) => `- \`${value}\``).join("\n") || "- None"}\n`;
}

function rule(id, prefixes, obligations) { return { id, prefixes, obligations, matches: (files) => files.some((file) => prefixes.some((prefix) => file === prefix || file.startsWith(prefix))) }; }
function obligation(id, criticality, documents) { return { id, criticality, documents }; }
function requirement(candidate, item, documentationFiles, notApplicable = {}) {
  const matchedDocuments = documentationFiles.filter((file) => item.documents.some((document) => file === document || file.startsWith(document)));
  const rationale = notApplicable?.[item.id];
  return { id: item.id, component: candidate.id, criticality: item.criticality, reason: `${candidate.id} changes require synchronized ${item.id.replaceAll("-", " ")}.`, candidateDocuments: item.documents, matchedDocuments, status: matchedDocuments.length ? "pass" : rationale ? "not-applicable" : "fail", mandatory: true, ...(rationale ? { rationale } : {}) };
}
function couplingRequirement(id, criticality, reason, candidates, matches, notApplicable = {}) {
  const rationale = notApplicable?.[id];
  return { id, component: "cross-cutting", criticality, reason, candidateDocuments: candidates, matchedDocuments: matches, status: matches.length ? "pass" : rationale ? "not-applicable" : "fail", mandatory: true, ...(rationale ? { rationale } : {}) };
}
function deduplicateRequirements(items) { return [...new Map(items.map((item) => [item.id, item])).values()].sort((left, right) => left.id.localeCompare(right.id)); }
function normalize(file) { return String(file).trim().replaceAll("\\", "/").replace(/^\.\//, ""); }
function isGeneratedSite(file) { return file.startsWith("website/dist/") || file.startsWith("dist/"); }
function isDocumentation(file) { return !isGeneratedSite(file) && (file.startsWith("docs/") || ROOT_DOCUMENTS.has(file) || file === "CODE_OF_CONDUCT.md" || file === "MAINTAINERS.md" || file === "NOTICE" || file === "LICENSE" || file.startsWith("website/")); }
function isImplementation(file) { return file.startsWith("src/") || file.startsWith("bin/") || file.startsWith("scripts/") || file.startsWith("modules/") || file.startsWith("plugins/") || file.startsWith("providers/") || file.startsWith("templates/") || file.startsWith(".github/workflows/") || file === "package.json" || file === "package-lock.json" || file.startsWith("Dockerfile") || file.startsWith("docker-compose"); }
