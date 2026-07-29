import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CATEGORY_DEFINITIONS,
  MODULE_CRITICALITY_THRESHOLDS,
  PROFILE_DOMAIN_THRESHOLDS,
  PROFILE_EXPECTATIONS,
  THRESHOLDS,
  calculateChangeReadiness,
  validateChangeReadinessScorecard,
} from "../src/change-readiness.js";

const EXAMPLE = new URL("../docs/evidence/changes/example-standard-feature/scorecard.json", import.meta.url);
const NOW = new Date("2026-07-28T12:00:00.000Z");

test("change readiness weights total exactly 100", () => {
  assert.equal(CATEGORY_DEFINITIONS.reduce((total, category) => total + category.weight, 0), 100);
  assert.equal(CATEGORY_DEFINITIONS.length, 14);
});

test("canonical example validates as enterprise-ready merge evidence", async () => {
  const document = await example();
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.score, 100);
  assert.equal(report.calculated.gateSatisfied, true);
});

test("risk tiers and checkpoints use the approved thresholds", async () => {
  const expected = {
    "tier-0": { push: 80, merge: 85, release: null },
    "tier-1": { push: 85, merge: 90, release: 90 },
    "tier-2": { push: 90, merge: 95, release: 95 },
    "tier-3": { push: 90, merge: 95, release: 95 },
  };
  for (const [riskTier, checkpoints] of Object.entries(expected)) {
    for (const [checkpoint, threshold] of Object.entries(checkpoints)) {
      assert.equal(THRESHOLDS[riskTier][checkpoint], threshold);
      if (threshold === null) {
        const document = await example();
        document.riskTier = riskTier;
        document.checkpoint = checkpoint;
        synchronize(document);
        document.decision.status = "hold";
        const report = validateChangeReadinessScorecard(document, { now: NOW });
        assert.match(report.issues.join("\n"), /tier-0 changes do not have a release checkpoint/);
      }
    }
  }
});

test("profiles assign independent 100, 95, and 90 percent domain gates", async () => {
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["documentation-content"]["product-governance"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["documentation-content"]["architecture-system-design"], 95);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["documentation-content"]["documentation-developer-experience"], 90);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["standard-code"]["security-privacy-trust"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["standard-code"]["testing-quality-assurance"], 95);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["standard-code"]["code-quality-maintainability"], 90);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["frontend-uiux"]["frontend-uiux-accessibility"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["backend-api-data"]["api-contracts-data"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["registry-ecosystem"]["reliability-recovery-rollback"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["release-version"]["compatibility-versioning-release"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["capability-package"]["api-contracts-data"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["host-adapter-portability"]["compatibility-versioning-release"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["agent-team-runtime"]["performance-scalability-cost"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["orchestration-automation"]["reliability-recovery-rollback"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["rule-guardrail-package"]["security-privacy-trust"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["knowledge-memory-capability"]["api-contracts-data"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["capability-builder-publisher"]["frontend-uiux-accessibility"], 100);
  assert.equal(PROFILE_DOMAIN_THRESHOLDS["marketplace-registry-distribution"]["devops-supply-chain"], 100);

  const document = await example();
  const calculated = calculateChangeReadiness(document);
  assert.equal(calculated.categories.find(({ id }) => id === "security-privacy-trust").requiredScore, 100);
  assert.equal(calculated.categories.find(({ id }) => id === "testing-quality-assurance").requiredScore, 95);
  assert.equal(calculated.categories.find(({ id }) => id === "code-quality-maintainability").requiredScore, 90);
});

test("module criticality gates are independent and checkpoint aware", async () => {
  assert.deepEqual(MODULE_CRITICALITY_THRESHOLDS, { standard: 90, important: 95, critical: 100 });
  const document = await example();
  document.moduleAssessments[1].criteria = [
    { id: "critical-pass", description: "Critical behavior passes", points: 99, mandatory: true, status: "pass", rationale: "", evidence: ["test/change-readiness.test.js"] },
    { id: "minor-gap", description: "One non-mandatory point remains", points: 1, mandatory: false, status: "fail", rationale: "Bounded test gap.", evidence: [] },
  ];
  synchronize(document);
  document.decision.status = "hold";
  let report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.score, 100);
  assert.deepEqual(report.calculated.failedModules, ["validation tests"]);
  assert.equal(report.calculated.moduleGateSatisfied, false);
  assert.equal(report.calculated.gateSatisfied, false);

  document.checkpoint = "push";
  synchronize(document);
  report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.moduleAssessments.find(({ component }) => component === "validation tests").requiredScore, 95);
  assert.equal(report.calculated.moduleGateSatisfied, true);
  assert.equal(report.calculated.categories.find(({ id }) => id === "security-privacy-trust").requiredScore, 95);
});

test("module assessments must cover every affected component and match derived gates", async () => {
  const document = await example();
  document.moduleAssessments.pop();
  let report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.match(report.issues.join("\n"), /exactly one record for every affected component/);

  const malformed = await example();
  malformed.moduleAssessments[0].requiredScore = 90;
  malformed.moduleAssessments[0].rationale = "";
  malformed.moduleAssessments[0].evidence = [];
  report = validateChangeReadinessScorecard(malformed, { now: NOW });
  assert.match(report.issues.join("\n"), /requiredScore must equal calculated value 95/);
  assert.match(report.issues.join("\n"), /rationale is required/);
  assert.match(report.issues.join("\n"), /evidence must be a non-empty string array/);
});

test("high-risk profiles cannot under-classify affected modules", async () => {
  const tierTwo = await example();
  tierTwo.riskTier = "tier-2";
  tierTwo.moduleAssessments[0].criticality = "standard";
  synchronize(tierTwo);
  tierTwo.decision.status = "hold";
  let report = validateChangeReadinessScorecard(tierTwo, { now: NOW });
  assert.match(report.issues.join("\n"), /tier-2 changes cannot classify affected modules as standard/);

  const security = await example();
  security.profile = "security-trust";
  security.moduleAssessments.forEach((assessment) => { assessment.criticality = "important"; });
  synchronize(security);
  security.decision.status = "hold";
  report = validateChangeReadinessScorecard(security, { now: NOW });
  assert.match(report.issues.join("\n"), /requires at least one critical module assessment/);
});

test("module scores are derived from weighted criteria and mandatory criteria fail closed", async () => {
  const document = await example();
  const module = document.moduleAssessments[0];
  module.criteria = [
    { id: "required", description: "Mandatory contract", points: 90, mandatory: true, status: "partial", rationale: "Incomplete evidence.", evidence: ["test/change-readiness.test.js"] },
    { id: "optional", description: "Optional polish", points: 10, mandatory: false, status: "pass", rationale: "", evidence: ["test/change-readiness.test.js"] },
  ];
  synchronize(document);
  document.decision.status = "hold";
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.moduleAssessments[0].score, 55);
  assert.equal(report.calculated.moduleAssessments[0].status, "fail");
  assert.equal(report.calculated.moduleGateSatisfied, false);
});

test("malformed module records and criteria fail closed without throwing", async () => {
  const invalidRecord = await example();
  invalidRecord.moduleAssessments[0] = null;
  let report = validateChangeReadinessScorecard(invalidRecord, { now: NOW });
  assert.match(report.issues.join("\n"), /Every module assessment must be an object/);

  const duplicate = await example();
  duplicate.moduleAssessments[0] = {
    ...duplicate.moduleAssessments[0],
    component: "validation tests",
    criticality: "unknown",
    status: "unknown",
    rationale: "",
    evidence: [],
    criteria: [],
    requiredScore: 0,
    applicablePoints: 0,
    earnedScore: 0,
    score: 0,
  };
  report = validateChangeReadinessScorecard(duplicate, { now: NOW });
  assert.match(report.issues.join("\n"), /duplicated/);
  assert.match(report.issues.join("\n"), /unsupported value/);
  assert.match(report.issues.join("\n"), /rationale is required/);
  assert.match(report.issues.join("\n"), /must contain acceptance criteria/);

  const invalidCriteria = await example();
  invalidCriteria.moduleAssessments[0].criteria = [
    null,
    { id: "", description: "", points: 0, mandatory: "yes", status: "unknown", rationale: "", evidence: [] },
    { id: "excluded", description: "Excluded criterion", points: 40, mandatory: false, status: "not-applicable", rationale: "", evidence: [] },
    { id: "partial", description: "Partial criterion", points: 40, mandatory: false, status: "partial", rationale: "", evidence: [] },
  ];
  report = validateChangeReadinessScorecard(invalidCriteria, { now: NOW });
  assert.match(report.issues.join("\n"), /criteria points must total 100/);
  assert.match(report.issues.join("\n"), /invalid criterion/);
  assert.match(report.issues.join("\n"), /criterion id is required/);
  assert.match(report.issues.join("\n"), /points must be positive/);
  assert.match(report.issues.join("\n"), /mandatory must be boolean/);
  assert.match(report.issues.join("\n"), /not-applicable rationale/);
  assert.match(report.issues.join("\n"), /requires evidence for partial/);
});

test("forged module calculations and tier-3 under-classification are rejected", async () => {
  const forged = await example();
  Object.assign(forged.moduleAssessments[0], { applicablePoints: 99, earnedScore: 98, score: 97, status: "fail" });
  let report = validateChangeReadinessScorecard(forged, { now: NOW });
  assert.match(report.issues.join("\n"), /applicablePoints must equal calculated value/);
  assert.match(report.issues.join("\n"), /earnedScore must equal calculated value/);
  assert.match(report.issues.join("\n"), /score must equal calculated value/);
  assert.match(report.issues.join("\n"), /status must equal calculated value/);

  const tierThree = await example();
  tierThree.riskTier = "tier-3";
  tierThree.moduleAssessments.forEach((assessment) => { assessment.criticality = "important"; });
  synchronize(tierThree);
  tierThree.decision.status = "hold";
  report = validateChangeReadinessScorecard(tierThree, { now: NOW });
  assert.match(report.issues.join("\n"), /tier-3 readiness requires at least one critical module assessment/);
});

test("partial earns half points and cannot satisfy a mandatory item", async () => {
  const document = await example();
  document.categories[0].items[0].status = "partial";
  synchronize(document);
  document.decision.status = "hold";
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.categories[0].earnedScore, 3);
  assert.deepEqual(report.calculated.mandatoryFailures, ["product-1"]);
  assert.equal(report.calculated.gateSatisfied, false);
});

test("not-applicable items require rationale and leave the denominator", async () => {
  const document = await example();
  const item = document.categories.find(({ id }) => id === "frontend-uiux-accessibility").items[0];
  item.status = "not-applicable";
  item.rationale = "No user-facing interface changes are included.";
  item.evidence = [];
  synchronize(document);
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.applicablePoints, 94);
  assert.equal(report.calculated.score, 100);

  item.rationale = "";
  assert.match(validateChangeReadinessScorecard(document, { now: NOW }).issues.join("\n"), /not-applicable rationale/);
});

test("mandatory blockers override a perfect score", async () => {
  const document = await example();
  document.blockers[0].status = "triggered";
  document.blockers[0].rationale = "Hosted CI failed.";
  document.decision.status = "ready";
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.calculated.score, 100);
  assert.equal(report.calculated.gateSatisfied, false);
  assert.match(report.issues.join("\n"), /Decision cannot be ready/);
});

test("tier-2 changes require every active domain to score at least 80 percent", async () => {
  const document = await example();
  document.riskTier = "tier-2";
  const item = document.categories[0].items[0];
  item.status = "partial";
  item.mandatory = false;
  synchronize(document);
  document.decision.status = "hold";
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.deepEqual(report.calculated.lowDomains, ["product-governance"]);
});

test("profile-required domains cannot be excluded", async () => {
  const document = await example();
  const category = document.categories.find(({ id }) => id === "testing-quality-assurance");
  category.items[0].status = "not-applicable";
  category.items[0].rationale = "Incorrect exclusion.";
  category.items[0].evidence = [];
  synchronize(document);
  document.decision.status = "hold";
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.match(report.issues.join("\n"), /requires category testing-quality-assurance to be active/);
});

test("expired waivers and malformed category contracts are rejected", async () => {
  const document = await example();
  document.waivers.push({ id: "W-1", owner: "Owner", requirement: "temporary exception", justification: "bounded transition", risk: "quality regression", compensatingControls: ["manual review"], approvedBy: "Maintainer", createdAt: "2026-01-01", expiresAt: "2026-02-01", remediationIssue: "#1" });
  document.categories[1].id = document.categories[0].id;
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.match(report.issues.join("\n"), /expired/);
  assert.match(report.issues.join("\n"), /duplicated/);
});

test("missing evidence and unsupported maturity claims are rejected", async () => {
  const document = await example();
  document.maturity = "unverified";
  document.categories[0].items[0].evidence = [];
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.match(report.issues.join("\n"), /maturity has unsupported value/);
  assert.match(report.issues.join("\n"), /requires evidence/);
});

test("all applicability profiles activate their defining domains", () => {
  for (const [profile, domains] of Object.entries(PROFILE_EXPECTATIONS)) {
    assert.ok(domains.length >= 7, `${profile} must activate meaningful coverage`);
    assert.ok(domains.every((id) => CATEGORY_DEFINITIONS.some((category) => category.id === id)));
  }
  assert.ok(PROFILE_EXPECTATIONS["frontend-uiux"].includes("frontend-uiux-accessibility"));
  assert.ok(PROFILE_EXPECTATIONS["backend-api-data"].includes("api-contracts-data"));
  assert.ok(PROFILE_EXPECTATIONS["registry-ecosystem"].includes("backend-integrations-concurrency"));
  assert.ok(PROFILE_EXPECTATIONS["release-version"].includes("compatibility-versioning-release"));
  assert.ok(PROFILE_EXPECTATIONS["capability-package"].includes("api-contracts-data"));
  assert.ok(PROFILE_EXPECTATIONS["host-adapter-portability"].includes("compatibility-versioning-release"));
  assert.ok(PROFILE_EXPECTATIONS["agent-team-runtime"].includes("frontend-uiux-accessibility"));
  assert.ok(PROFILE_EXPECTATIONS["orchestration-automation"].includes("backend-integrations-concurrency"));
  assert.ok(PROFILE_EXPECTATIONS["rule-guardrail-package"].includes("security-privacy-trust"));
  assert.ok(PROFILE_EXPECTATIONS["knowledge-memory-capability"].includes("api-contracts-data"));
  assert.ok(PROFILE_EXPECTATIONS["capability-builder-publisher"].includes("frontend-uiux-accessibility"));
  assert.ok(PROFILE_EXPECTATIONS["marketplace-registry-distribution"].includes("devops-supply-chain"));
});

test("malformed top-level contracts fail closed without throwing", () => {
  const empty = validateChangeReadinessScorecard(null, { now: NOW });
  assert.equal(empty.valid, false);
  assert.match(empty.issues.join("\n"), /JSON object/);

  const report = validateChangeReadinessScorecard({}, { now: NOW });
  assert.equal(report.valid, false);
  assert.match(report.issues.join("\n"), /schemaVersion/);
  assert.match(report.issues.join("\n"), /categories must contain exactly 14/);
  assert.match(report.issues.join("\n"), /blockers must contain exactly 12/);
  assert.match(report.issues.join("\n"), /assessments are required/);
  assert.match(report.issues.join("\n"), /waivers must be an array/);
  assert.match(report.issues.join("\n"), /decision is required/);
  assert.match(report.issues.join("\n"), /timestamps.assessedAt/);
  assert.match(report.issues.join("\n"), /totals are required/);
});

test("invalid metadata, category, item, blocker, decision, and timestamp branches are reported", async () => {
  const document = await example();
  Object.assign(document, { schemaVersion: 2, title: "", changeType: "unknown", profile: "unknown", riskTier: "unknown", checkpoint: "unknown", maturity: "unknown" });
  document.affectedComponents = [];
  document.categories[0] = { ...document.categories[0], id: "unknown-category", weight: 5, status: "unknown", items: [null] };
  document.blockers[0] = { id: "B-99", description: "", status: "unknown", rationale: "", evidence: [] };
  document.assessments.tests = [];
  document.waivers = [{}];
  document.decision = { status: "unknown", rationale: "", approvedBy: [""] };
  document.timestamps = { assessedAt: "not-a-date", reviewedAt: "not-a-date" };
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, false);
  assert.match(report.issues.join("\n"), /Unsupported category/);
  assert.match(report.issues.join("\n"), /invalid item/);
  assert.match(report.issues.join("\n"), /Unsupported blocker/);
  assert.match(report.issues.join("\n"), /invalid date/);
});

test("exclusions, failures, approvals, and current waivers exercise bounded decision paths", async () => {
  const document = await example();
  const optional = document.categories.find(({ id }) => id === "frontend-uiux-accessibility").items[0];
  optional.status = "fail";
  document.blockers[0] = { ...document.blockers[0], status: "not-applicable", rationale: "No executable quality gate applies to this example.", evidence: [] };
  document.waivers = [{ id: "W-2", owner: "Owner", requirement: "temporary evidence lag", justification: "bounded migration", risk: "delayed evidence", compensatingControls: ["maintainer review"], approvedBy: "Maintainer", createdAt: "2026-07-01", expiresAt: "2026-08-01", remediationIssue: "#2" }];
  synchronize(document);
  document.decision = { status: "reject", rationale: "A failed domain is rejected.", approvedBy: [] };
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.calculated.categories.find(({ id }) => id === "frontend-uiux-accessibility").status, "fail");
  assert.equal(report.calculated.gateSatisfied, false);
});

test("ready approvals and blocker evidence fail closed when incomplete", async () => {
  const document = await example();
  document.blockers[0].evidence = [];
  document.blockers[1].status = "not-applicable";
  document.blockers[1].rationale = "";
  document.decision.approvedBy = [];
  document.timestamps.reviewedAt = null;
  const report = validateChangeReadinessScorecard(document, { now: NOW });
  assert.match(report.issues.join("\n"), /requires evidence when clear/);
  assert.match(report.issues.join("\n"), /requires a not-applicable rationale/);
  assert.match(report.issues.join("\n"), /ready decision requires at least one approver/);
});

async function example() { return JSON.parse(await readFile(EXAMPLE, "utf8")); }

function synchronize(document) {
  const calculated = calculateChangeReadiness(document);
  for (const derived of calculated.categories) Object.assign(document.categories.find(({ id }) => id === derived.id), {
    status: derived.status,
    applicablePoints: derived.applicablePoints,
    earnedScore: derived.earnedScore,
    scorePercent: derived.scorePercent,
  });
  document.moduleAssessments = calculated.moduleAssessments;
  document.totals = {
    maximumWeight: calculated.maximumWeight,
    applicablePoints: calculated.applicablePoints,
    earnedPoints: calculated.earnedPoints,
    score: calculated.score,
    qualityBand: calculated.qualityBand,
    threshold: calculated.threshold,
    minimumDomainScore: calculated.minimumDomainScore,
    domainGateSatisfied: calculated.domainGateSatisfied,
    moduleGateSatisfied: calculated.moduleGateSatisfied,
  };
}
