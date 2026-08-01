import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { documentationGovernanceSources } from "../src/documentation-catalog.js";
import { analyzeDocumentationImpact } from "../src/documentation-impact.js";
import { validateGovernance } from "../src/governance-validation.js";

test("repository governance documents and capability claims validate", async () => {
  const report = await validateGovernance(process.cwd(), { now: new Date("2026-07-28T00:00:00Z") });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.ok(report.checkedDocuments >= 34);
  assert.ok(report.scorecardsChecked >= 1);
  assert.ok(report.documentationRecordsChecked >= 260);
  assert.equal(report.retrospectiveReleasesChecked, 5);
});

test("governance validation rejects expired waivers and stale compatibility evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    await writeFile(path.join(root, "docs/governance/waivers.json"), JSON.stringify({ schemaVersion: 1, waivers: [{ id: "W-1", owner: "Maintainers", requirement: "test", justification: "bounded exception", risk: "missed regression", compensatingControls: ["manual review"], approvedBy: "Maintainers", createdAt: "2025-01-01", expiresAt: "2025-02-01", remediationIssue: "#1" }] }));
    await writeFile(path.join(root, "docs/governance/compatibility-evidence.json"), JSON.stringify({ schemaVersion: 1, maximumAgeDays: 30, records: [{ id: "C-1", component: "example", owner: "Maintainers", verifiedAt: "2025-01-01", evidence: "docs/capabilities/reference.md" }] }));
    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    assert.match(report.issues.join("\n"), /expired/);
    assert.match(report.issues.join("\n"), /stale/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects missing retained evidence paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-evidence-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const scorecardPath = path.join(root, "docs/evidence/changes/example-standard-feature/scorecard.json");
    const scorecard = JSON.parse(await readFile(scorecardPath, "utf8"));
    scorecard.evidenceLinks = ["docs/evidence/missing-report.md"];
    await writeFile(scorecardPath, JSON.stringify(scorecard));
    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    assert.match(report.issues.join("\n"), /evidence path does not exist/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects a duplicated AgentSpace product authority", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-agentspace-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const visionPath = path.join(root, "docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md");
    const vision = await readFile(visionPath, "utf8");
    await writeFile(visionPath, vision.replace("not a separate product pillar", "a separate product pillar"));
    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    assert.match(report.issues.join("\n"), /not a separate product pillar/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects incomplete conversion evidence requirements", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-conversion-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const strategyPath = path.join(root, "docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md");
    const strategy = await readFile(strategyPath, "utf8");
    await writeFile(strategyPath, strategy.replaceAll("permission-delta", "permission-change"));
    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    assert.match(report.issues.join("\n"), /permission-delta/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects malformed documentation catalog metadata and health evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-catalog-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const catalogPath = path.join(root, "docs/reference/generated/documentation-catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const first = catalog.documents[0];
    const second = catalog.documents[1];
    delete first.title;
    first.classification = "unsupported";
    first.lifecycle = "unknown";
    first.audiences = "users";
    first.relevance = null;
    second.id = first.id;
    second.path = first.path;
    second.authority = first.authority ?? "duplicate-authority";
    first.authority = second.authority;
    const historical = catalog.documents.find((document) => document.classification === "historical-record");
    historical.lifecycle = "maintained";
    historical.replacement = null;
    historical.reviewBy = "2026-01-01";
    catalog.documents.push({ ...catalog.documents.at(-1), id: "doc:missing", path: "docs/missing.md", authority: null });
    await writeFile(catalogPath, JSON.stringify(catalog));

    const healthPath = path.join(root, "docs/reference/generated/documentation-health.json");
    const health = JSON.parse(await readFile(healthPath, "utf8"));
    health.documentCount = 0;
    health.decision = "hold";
    health.domains[0].score = 0;
    health.domains[0].status = "fail";
    await writeFile(healthPath, JSON.stringify(health));

    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    const issues = report.issues.join("\n");
    for (const expected of ["missing title", "duplicates ID", "duplicates path", "unsupported classification", "unsupported lifecycle", "must define audiences as an array", "incomplete relevance", "authority", "Historical document", "expired review deadline", "references missing file", "health evidence does not match", "health decision is hold", "does not satisfy"]) assert.match(issues, new RegExp(expected, "i"), expected);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects invalid and empty documentation catalogs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-empty-catalog-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const catalogPath = path.join(root, "docs/reference/generated/documentation-catalog.json");
    await writeFile(catalogPath, JSON.stringify({ schemaVersion: 2, documents: [] }));
    let report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /schemaVersion 1 and contain documents/);

    await writeFile(catalogPath, "not json");
    report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /documentation-catalog.json is not valid JSON/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects unsafe evidence and malformed waiver and compatibility contracts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-contracts-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const scorecardPath = path.join(root, "docs/evidence/changes/example-standard-feature/scorecard.json");
    const scorecard = JSON.parse(await readFile(scorecardPath, "utf8"));
    scorecard.evidenceLinks = ["../outside.md", "#local-anchor", "https://example.com/evidence"];
    await writeFile(scorecardPath, JSON.stringify(scorecard));
    await writeFile(path.join(root, "docs/governance/waivers.json"), JSON.stringify({ schemaVersion: 1, waivers: [{ id: "W-invalid", owner: "", expiresAt: "not-a-date" }] }));
    await writeFile(path.join(root, "docs/governance/compatibility-evidence.json"), JSON.stringify({ schemaVersion: 1, maximumAgeDays: 30, records: [{ id: "C-invalid", verifiedAt: "not-a-date" }] }));
    let report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    const issues = report.issues.join("\n");
    assert.match(issues, /repository-relative safe path/);
    assert.match(issues, /Waiver W-invalid is missing owner/);
    assert.match(issues, /invalid expiresAt date/);
    assert.match(issues, /Compatibility record C-invalid is missing component/);
    assert.match(issues, /invalid verifiedAt date/);

    await writeFile(path.join(root, "docs/governance/waivers.json"), JSON.stringify({ schemaVersion: 2, waivers: null }));
    await writeFile(path.join(root, "docs/governance/compatibility-evidence.json"), JSON.stringify({ schemaVersion: 2, maximumAgeDays: 0, records: null }));
    report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /waivers.json must use schemaVersion 1/);
    assert.match(report.issues.join("\n"), /compatibility-evidence.json must define schemaVersion 1/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validation rejects retroactive release certification", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-releases-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const ledgerPath = path.join(root, "docs/governance/release-retrospectives.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
    ledger.releases.find(({ tag }) => tag === "v1.3.0").decision = "current-certified";
    await writeFile(ledgerPath, JSON.stringify(ledger));
    const report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.valid, false);
    assert.match(report.issues.join("\n"), /cannot be current-certified/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("governance validates retained documentation impact evidence and fails closed on corruption", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-governance-impact-"));
  try {
    await copyGovernanceFixture(process.cwd(), root);
    const directory = path.join(root, "docs/evidence/changes/provider-impact");
    await mkdir(directory, { recursive: true });
    const impactPath = path.join(directory, "documentation-impact.json");
    const impact = analyzeDocumentationImpact(["src/providers.js", "test/providers.test.js", "docs/providers/reference.md", "docs/reference/generated/providers.md"], { changeId: "provider-impact", generatedAt: "2026-07-28T00:00:00.000Z" });
    await writeFile(impactPath, JSON.stringify(impact));
    let report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.equal(report.impactReportsChecked, 1);
    assert.doesNotMatch(report.issues.join("\n"), /documentation-impact\.json/);

    impact.decision = "hold";
    await writeFile(impactPath, JSON.stringify(impact));
    report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /decision must be ready|must be hold/);

    await writeFile(impactPath, "not json");
    report = await validateGovernance(root, { now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /documentation-impact.json is not valid JSON/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function copyGovernanceFixture(source, target) {
  const files = [
    "AGENTS.md", "docs/ENGINEERING_GOVERNANCE.md", "docs/strategy/PLATFORM_CONSTITUTION.md", "docs/strategy/FORGEVENA_PLATFORM_BLUEPRINT.md", "docs/strategy/FORGEVENA_VERSIONED_PRODUCT_ROADMAP.md", "docs/strategy/INNOVATION_OPPORTUNITY_PORTFOLIO.md", "docs/strategy/FORGEHUB_ECOSYSTEM_VISION.md", "docs/architecture/FORGE_REGISTRY_PROTOCOL_AND_ARCHITECTURE.md", "docs/architecture/ECOSYSTEM_CAPABILITY_AND_PACKAGE_MODEL.md", "docs/architecture/ENTERPRISE_CAPABILITY_SYSTEM.md", "docs/architecture/HOST_ADAPTER_AND_PORTABILITY_STRATEGY.md", "docs/architecture/EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md", "docs/architecture/ORCHESTRATION_AND_AGENT_RUNTIME_STRATEGY.md", "docs/security/ECOSYSTEM_TRUST_AND_SAFETY_MODEL.md", "docs/strategy/FORGEHUB_PRODUCT_EXPERIENCE.md", "docs/developer/PUBLISHER_AND_ECOSYSTEM_SDK_STRATEGY.md", "docs/strategy/AI_ENGINEERING_OS_EVOLUTION.md", "docs/strategy/ECOSYSTEM_PRODUCT_AND_SUSTAINABILITY_STRATEGY.md", "docs/strategy/ECOSYSTEM_ADR_CANDIDATES.md", "docs/capabilities/reference.md",
    "docs/governance/FEATURE_PROPOSAL_TEMPLATE.md", "docs/governance/ADR_TEMPLATE.md", "docs/governance/THREAT_MODEL_TEMPLATE.md", "docs/governance/RELEASE_SCORECARD_TEMPLATE.md", "docs/governance/COMPATIBILITY_REPORT_TEMPLATE.md", "docs/governance/DEPRECATION_NOTICE_TEMPLATE.md", "docs/governance/POST_RELEASE_REVIEW_TEMPLATE.md", "docs/governance/waivers.json", "docs/governance/compatibility-evidence.json", "docs/governance/release-retrospectives.json", "docs/governance/CHANGE_READINESS_SCORECARD.md", "docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md", "docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md", "docs/governance/DOCUMENTATION_IMPACT_REPORT_TEMPLATE.md", "docs/governance/DOCUMENTATION_AUTHORITY_MAP.md", "docs/strategy/RESEARCH_AND_STANDARDS_RADAR.md", "docs/reports/ENTERPRISE_DOCUMENTATION_AUDIT_REPORT.md", "docs/reports/HISTORICAL_RELEASE_GOVERNANCE_RETROSPECTIVE.md", "docs/reports/VERSION_IMPLEMENTATION_READINESS_COMPARISON.md", "docs/reference/schemas/change-readiness-scorecard.schema.json", "docs/reference/schemas/document-catalog.schema.json", "docs/reference/schemas/documentation-impact.schema.json", "docs/reference/schemas/release-retrospective.schema.json", "docs/reference/schemas/version-implementation-readiness-audit.schema.json", "docs/evidence/changes/README.md", "docs/evidence/changes/example-standard-feature/scorecard.json", "docs/evidence/changes/example-standard-feature/scorecard.md", "docs/reference/generated/documentation-catalog.json", "docs/reference/generated/documentation-health.json",
    "docs/reports/VERSION_IMPLEMENTATION_READINESS_REMEDIATION_PLAN.md",
  ];
  for (const relative of files) {
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(path.join(source, relative)));
  }
  for (const [relative, contents] of Object.entries(await documentationGovernanceSources(target))) {
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
}
