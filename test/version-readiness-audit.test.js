import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  AUDITED_VERSIONS, SCORE_CATEGORIES, bootstrapVersionReadinessAudits, createProspectiveVersionReadinessAudit,
  REQUIRED_IMPLEMENTATION_CONTRACT_SECTIONS, assessImplementationContract, normalizeGeneratedMarkdown,
  renderAuditMarkdown, renderComparisonMarkdown,
  renderDependencyMapMarkdown, renderOwnershipMatrixMarkdown, validateVersionReadinessAudits,
  validateVersionReadinessAuditRecord, writeVersionReadinessReports,
} from "../src/version-readiness-audit.js";
import { loadVersionDocumentationSources } from "../src/version-documentation.js";

const root = process.cwd();

test("all future version readiness audits are valid and release-blocking", async () => {
  const result = await validateVersionReadinessAudits(root);
  assert.deepEqual(result.issues, []);
  assert.equal(result.audits.length, 16);
  assert.deepEqual(result.audits.map(({ auditedVersion }) => auditedVersion), AUDITED_VERSIONS);
  for (const [index, audit] of result.audits.entries()) {
    assert.equal(audit.schemaVersion, 2);
    assert.equal(audit.verdict, "approve");
    assert.equal(audit.reAuditRequired, false);
    assert.equal(audit.findings.length, 0);
    assert.equal(audit.inheritedDependencyBlockers.length, 0);
    for (const category of SCORE_CATEGORIES) assert.equal(Number.isInteger(audit.scores[category]), true);
  }
});

test("generated audit reports and consolidated views match retained evidence", async () => {
  const { audits } = await validateVersionReadinessAudits(root);
  for (const audit of audits) {
    const actual = await readFile(path.join(root, `docs/evidence/changes/version-readiness-audit-${audit.auditedVersion}/audit.md`), "utf8");
    assert.equal(normalizeGeneratedMarkdown(actual), renderAuditMarkdown(audit));
  }
  const reports = [
    ["docs/reports/VERSION_IMPLEMENTATION_READINESS_COMPARISON.md", renderComparisonMarkdown(audits)],
    ["docs/reports/VERSION_READINESS_DEPENDENCY_MAP.md", renderDependencyMapMarkdown(audits)],
    ["docs/reports/VERSION_READINESS_BLOCKER_OWNERSHIP_MATRIX.md", renderOwnershipMatrixMarkdown(audits)],
  ];
  for (const [relative, expected] of reports) {
    assert.equal(normalizeGeneratedMarkdown(await readFile(path.join(root, relative), "utf8")), normalizeGeneratedMarkdown(expected));
  }
});

test("generated audit verification accepts Windows line endings", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "forgevena-readiness-crlf-"));
  try {
    await cp(path.join(root, "docs"), path.join(temporaryRoot, "docs"), { recursive: true });
    const auditPath = path.join(temporaryRoot, "docs", "evidence", "changes", "version-readiness-audit-v1.4.0", "audit.md");
    const reportPath = path.join(temporaryRoot, "docs", "reports", "VERSION_IMPLEMENTATION_READINESS_COMPARISON.md");
    for (const target of [auditPath, reportPath]) {
      const contents = await readFile(target, "utf8");
      await writeFile(target, contents.replace(/\n/g, "\r\n"), "utf8");
    }
    const script = path.join(root, "scripts", "version-readiness-audits.js");
    const result = JSON.parse(execFileSync(process.execPath, [script, "--all", "--verify", "--comparison"], { cwd: temporaryRoot, encoding: "utf8" }));
    assert.equal(result.valid, true);
    assert.equal(result.versions, 16);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("audit schema v2 exposes dependency-aware evidence", async () => {
  const schema = JSON.parse(await readFile(path.join(root, "docs/reference/schemas/version-implementation-readiness-audit.schema.json"), "utf8"));
  assert.equal(schema.properties.schemaVersion.const, 2);
  assert.equal(schema.properties.auditedVersion.enum.length, 16);
  assert.ok(schema.required.includes("inheritedDependencyBlockers"));
  assert.ok(schema.required.includes("findings"));
  assert.ok(schema.required.includes("agentReadiness"));
});

test("audit CLI supports all, single-version, comparison, and remediation verification", () => {
  const script = path.join(root, "scripts", "version-readiness-audits.js");
  const all = JSON.parse(execFileSync(process.execPath, [script, "--all", "--verify", "--comparison"], { cwd: root, encoding: "utf8" }));
  assert.equal(all.valid, true);
  assert.equal(all.versions, 16);
  const single = JSON.parse(execFileSync(process.execPath, [script, "--version", "v2.4.0", "--verify", "--remediation"], { cwd: root, encoding: "utf8" }));
  assert.equal(single.valid, true);
  assert.equal(single.versions, 1);
});

test("audit CLI regenerates deterministic audit and remediation evidence", () => {
  const script = path.join(root, "scripts", "version-readiness-audits.js");
  const result = JSON.parse(execFileSync(process.execPath, [script, "--all", "--apply", "--comparison", "--remediation"], { cwd: root, encoding: "utf8" }));
  assert.equal(result.valid, true);
  assert.equal(result.mode, "write");
  assert.equal(result.comparison, true);
  assert.equal(result.remediation, true);
});

test("released tags have no prospective readiness audit directories", async () => {
  const historical = ["v1.2.0", "v1.2.1", "v1.2.2", "v1.2.3", "v1.3.0"];
  for (const version of historical) {
    await assert.rejects(readFile(path.join(root, `docs/evidence/changes/version-readiness-audit-${version}/audit.json`), "utf8"));
  }
});

test("prospective audits derive version-owned findings and predecessor inheritance", async () => {
  const { catalog } = await loadVersionDocumentationSources(root);
  const firstSpecification = catalog.versions[0];
  const first = createProspectiveVersionReadinessAudit(firstSpecification, 0);
  assert.equal(first.auditedVersion, "v1.4.0");
  assert.deepEqual(first.inheritedDependencyBlockers, []);
  assert.equal(first.dependencyStatus.includes("v1.3.0"), true);
  assert.deepEqual(first.traceability.map(({ featureId }) => featureId).sort(), firstSpecification.features.filter(({ status }) => status === "committed").map(({ id }) => id).sort());
  assert.equal(first.roleQuestions.length, 9);
  assert.equal(renderAuditMarkdown(first).includes("None. This audit owns its listed blockers"), true);

  const secondSpecification = catalog.versions[1];
  const heldPredecessor = structuredClone(first);
  const second = createProspectiveVersionReadinessAudit(secondSpecification, 1, heldPredecessor);
  assert.equal(second.inheritedDependencyBlockers[0].version, "v1.4.0");
  assert.equal(second.dependencyStatus.includes("HOLD"), true);
  assert.equal(second.scores.security < second.scores.product, true);
  assert.equal(renderAuditMarkdown(second).includes("version-readiness-audit-v1.4.0/audit.md"), true);

  const approvedPredecessor = structuredClone(first);
  approvedPredecessor.verdict = "approve";
  const unblocked = createProspectiveVersionReadinessAudit(secondSpecification, 1, approvedPredecessor);
  assert.deepEqual(unblocked.inheritedDependencyBlockers, []);
});

test("re-audit holds a package when its normative implementation contract is incomplete", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "forgevena-readiness-hold-"));
  try {
    await cp(path.join(root, "docs"), path.join(temporaryRoot, "docs"), { recursive: true });
    await writeFile(path.join(temporaryRoot, "docs", "versions", "v1.4.0", "implementation-contract.md"), "# Incomplete contract\n", "utf8");
    const audits = await bootstrapVersionReadinessAudits(temporaryRoot);
    const first = audits[0];
    assert.equal(first.verdict, "hold");
    assert.equal(first.reAuditRequired, true);
    assert.ok(first.findings.some((finding) => finding.category === "documentation-reaudit-contract"));
    assert.ok(first.findings.some((finding) => finding.category === "documentation-reaudit-structure"));
    assert.ok(first.findings.some((finding) => finding.category === "documentation-reaudit-security"));
    assert.equal(audits[1].inheritedDependencyBlockers[0].version, "v1.4.0");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("implementation contracts satisfy version-specific semantic controls", async () => {
  const { catalog } = await loadVersionDocumentationSources(root);
  for (const specification of catalog.versions) {
    const contract = await readFile(path.join(root, specification.implementationContract), "utf8");
    assert.deepEqual(assessImplementationContract(contract, specification), [], specification.version);
    for (const heading of REQUIRED_IMPLEMENTATION_CONTRACT_SECTIONS) assert.ok(contract.includes(`## ${heading}`), `${specification.version}: ${heading}`);
  }
});

test("retained approval fails closed when its current contract becomes incomplete", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "forgevena-readiness-stale-"));
  try {
    await cp(path.join(root, "docs"), path.join(temporaryRoot, "docs"), { recursive: true });
    await writeFile(path.join(temporaryRoot, "docs", "versions", "v1.4.0", "implementation-contract.md"), "# Incomplete contract\n", "utf8");
    const validation = await validateVersionReadinessAudits(temporaryRoot, { versions: ["v1.4.0"] });
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some((issue) => issue.includes("cannot approve the current implementation contract")));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("record validation fails closed for malformed contracts and false approvals", async () => {
  const { catalog } = await loadVersionDocumentationSources(root);
  const specification = catalog.versions[0];
  const audit = createProspectiveVersionReadinessAudit(specification, 0);
  const malformed = structuredClone(audit);
  malformed.schemaVersion = 1;
  malformed.auditedVersion = "v9.9.9";
  malformed.verdict = "ship";
  malformed.overallScore = 101;
  malformed.scores.product = -1;
  malformed.findings.push({ ...malformed.findings[0] });
  malformed.findings[0].severity = "urgent";
  malformed.findings[0].blocking = "yes";
  malformed.findings[0].affectedFeatures = "all";
  delete malformed.findings[0].owner;
  malformed.inheritedDependencyBlockers = [{ version: "v1.3.0" }];
  malformed.traceability = [];
  malformed.agentReadiness.codex = "maybe";
  malformed.reAuditRequired = false;
  delete malformed.executiveVerdict;
  const issues = validateVersionReadinessAuditRecord(malformed, "v1.4.0", specification);
  for (const expected of ["schemaVersion 2", "audits v9.9.9", "unsupported verdict ship", "invalid overallScore", "invalid score product", "duplicates finding", "unsupported severity urgent", "must declare blocking", "must declare affectedFeatures", "missing owner", "inherited blocker is missing auditId", "trace every committed feature", "must require re-audit", "invalid agent readiness for codex"]) {
    assert.ok(issues.some((issue) => issue.includes(expected)), expected);
  }

  const falseApproval = createProspectiveVersionReadinessAudit(specification, 0);
  falseApproval.verdict = "approve";
  falseApproval.reAuditRequired = false;
  assert.ok(validateVersionReadinessAuditRecord(falseApproval, "v1.4.0", specification).some((issue) => issue.includes("cannot approve")));

  const malformedCollections = createProspectiveVersionReadinessAudit(specification, 0);
  malformedCollections.findings = [];
  malformedCollections.inheritedDependencyBlockers = "invalid";
  const collectionIssues = validateVersionReadinessAuditRecord(malformedCollections, "v1.4.0", specification);
  assert.ok(collectionIssues.some((issue) => issue.includes("requires findings")));
  assert.ok(collectionIssues.some((issue) => issue.includes("must declare inheritedDependencyBlockers")));
});

test("validation rejects unknown versions and report writing can omit comparisons", async () => {
  const invalid = await validateVersionReadinessAudits(root, { versions: ["v9.9.9"] });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.issues.some((issue) => issue.includes("Unknown future version v9.9.9")));

  const { catalog } = await loadVersionDocumentationSources(root);
  const audit = createProspectiveVersionReadinessAudit(catalog.versions[0], 0);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "forgevena-readiness-report-"));
  try {
    const target = path.join(temporaryRoot, "docs", "evidence", "changes", "version-readiness-audit-v1.4.0");
    await mkdir(target, { recursive: true });
    await writeVersionReadinessReports(temporaryRoot, [audit], { comparison: false });
    assert.equal((await readFile(path.join(target, "audit.md"), "utf8")).includes("v1.4.0 Implementation Readiness Audit"), true);
    await assert.rejects(readFile(path.join(temporaryRoot, "docs", "reports", "VERSION_IMPLEMENTATION_READINESS_COMPARISON.md"), "utf8"));
    await mkdir(path.join(temporaryRoot, "docs", "reports"), { recursive: true });
    await writeVersionReadinessReports(temporaryRoot, [audit]);
    for (const report of ["VERSION_IMPLEMENTATION_READINESS_COMPARISON.md", "VERSION_READINESS_DEPENDENCY_MAP.md", "VERSION_READINESS_BLOCKER_OWNERSHIP_MATRIX.md"]) {
      assert.equal((await readFile(path.join(temporaryRoot, "docs", "reports", report), "utf8")).length > 100, true);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
