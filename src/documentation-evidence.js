import { mkdir, readFile, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { renderDocumentationImpactMarkdown, validateDocumentationImpactReport } from "./documentation-impact.js";

export const DOCUMENTATION_EVIDENCE_SCHEMA_VERSION = 1;

const REQUIRED_REPORTS = Object.freeze([
  "documentation-impact.json",
  "documentation-impact.md",
  "updated-documents.md",
  "missing-documentation.md",
  "documentation-coverage.md",
  "documentation-quality.json",
  "documentation-synchronization.md",
  "release-documentation-summary.md",
  "version-history-impact.md",
  "migration-impact.md",
  "repository-health.md",
]);

export const REQUIRED_DOCUMENTATION_EVIDENCE_REPORTS = Object.freeze([...REQUIRED_REPORTS]);

export async function writeDocumentationEvidenceBundle(root, outputDirectory, report) {
  const validation = validateDocumentationImpactReport(report);
  if (!validation.valid) throw new Error(`Invalid documentation impact report: ${validation.issues.join(" ")}`);
  const health = await readJson(path.join(root, "docs", "reference", "generated", "documentation-health.json"));
  const coverage = await readText(path.join(root, "docs", "reference", "generated", "documentation-coverage-matrix.md"));
  const files = evidenceFiles(report, health, coverage);
  await mkdir(outputDirectory, { recursive: true });
  for (const [name, contents] of Object.entries(files)) await writeFile(path.join(outputDirectory, name), contents, "utf8");
  const manifest = {
    schemaVersion: DOCUMENTATION_EVIDENCE_SCHEMA_VERSION,
    changeId: report.changeId,
    checkpoint: report.checkpoint,
    generatedAt: report.generatedAt,
    decision: report.decision,
    reports: Object.fromEntries(Object.entries(files).map(([name, contents]) => [name, { sha256: digest(contents), bytes: Buffer.byteLength(contents) }])),
  };
  await writeFile(path.join(outputDirectory, "evidence-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { outputDirectory, manifest };
}

export async function validateDocumentationEvidenceBundle(outputDirectory) {
  const issues = [];
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(outputDirectory, "evidence-manifest.json"), "utf8")); }
  catch { return { valid: false, issues: ["evidence-manifest.json is missing or invalid."] }; }
  if (manifest.schemaVersion !== DOCUMENTATION_EVIDENCE_SCHEMA_VERSION) issues.push(`schemaVersion must be ${DOCUMENTATION_EVIDENCE_SCHEMA_VERSION}.`);
  if (!["push", "merge", "release"].includes(manifest.checkpoint)) issues.push("Evidence checkpoint is invalid.");
  if (!["ready", "hold"].includes(manifest.decision)) issues.push("Evidence decision is invalid.");
  for (const name of REQUIRED_REPORTS) {
    const metadata = manifest.reports?.[name];
    if (!metadata) { issues.push(`${name} is missing from the evidence manifest.`); continue; }
    try {
      const contents = await readFile(path.join(outputDirectory, name), "utf8");
      if (digest(contents) !== metadata.sha256) issues.push(`${name} checksum does not match.`);
      if (Buffer.byteLength(contents) !== metadata.bytes) issues.push(`${name} byte count does not match.`);
    } catch { issues.push(`${name} is missing.`); }
  }
  try {
    const impact = JSON.parse(await readFile(path.join(outputDirectory, "documentation-impact.json"), "utf8"));
    issues.push(...validateDocumentationImpactReport(impact).issues.map((issue) => `documentation-impact.json: ${issue}`));
    if (impact.decision !== manifest.decision || impact.changeId !== manifest.changeId || impact.checkpoint !== manifest.checkpoint) issues.push("Evidence manifest does not agree with documentation-impact.json.");
  } catch { issues.push("documentation-impact.json is invalid."); }
  return { valid: issues.length === 0, issues, reportsChecked: REQUIRED_REPORTS.length };
}

function evidenceFiles(report, health, coverage) {
  const changed = list(report.documentationFiles, "No documentation files changed.");
  const missing = report.requirements.filter((item) => item.status === "fail").map((item) => `- \`${item.id}\`: ${item.reason}`).join("\n") || "No missing documentation obligations detected.";
  const releaseAffected = report.affectedComponents.includes("release-version-and-distribution");
  const migration = report.requirements.filter((item) => /migration|recovery|rollback/i.test(`${item.id} ${item.reason}`));
  return {
    "documentation-impact.json": `${JSON.stringify(report, null, 2)}\n`,
    "documentation-impact.md": renderDocumentationImpactMarkdown(report),
    "updated-documents.md": reportMarkdown("Updated Document List", changed),
    "missing-documentation.md": reportMarkdown("Missing Documentation Report", missing),
    "documentation-coverage.md": coverage,
    "documentation-quality.json": `${JSON.stringify(health, null, 2)}\n`,
    "documentation-synchronization.md": reportMarkdown("Documentation Synchronization Report", `- Decision: **${report.decision.toUpperCase()}**\n- Checkpoint: \`${report.checkpoint}\`\n- Requirements: ${report.requirements.length}\n- Blockers: ${report.blockers.length}`),
    "release-documentation-summary.md": reportMarkdown("Release Documentation Summary", releaseAffected ? "Release or distribution surfaces changed; release history and operations evidence are mandatory." : "Not applicable: no release or distribution surface changed."),
    "version-history-impact.md": reportMarkdown("Version History Impact", releaseAffected ? "Version-history synchronization is required before promotion." : "Not applicable: no version or release metadata changed."),
    "migration-impact.md": reportMarkdown("Migration Impact Summary", migration.length ? migration.map((item) => `- \`${item.id}\`: ${item.status}${item.rationale ? ` — ${item.rationale}` : ""}`).join("\n") : "Not applicable: no migration, recovery, or rollback obligation was detected."),
    "repository-health.md": reportMarkdown("Repository Health Report", `- Documentation decision: **${health.decision.toUpperCase()}**\n- Documentation score: ${health.score}\n- Documents assessed: ${health.documentCount}\n- Findings: ${health.issues.length}`),
  };
}

function reportMarkdown(title, body) { return `# ${title}\n\n${body}\n`; }
function list(values, empty) { return values.length ? values.map((value) => `- \`${value}\``).join("\n") : empty; }
function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function readText(file) { return readFile(file, "utf8"); }
async function readJson(file) { return JSON.parse(await readText(file)); }
