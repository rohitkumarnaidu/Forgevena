import assert from "node:assert/strict";
import test from "node:test";
import { analyzeDocumentationImpact, renderDocumentationImpactMarkdown, validateDocumentationImpactReport } from "../src/documentation-impact.js";

test("documentation impact maps implementation changes to canonical evidence", () => {
  const report = analyzeDocumentationImpact([
    "src/providers.js",
    "test/providers.test.js",
    "docs/providers/reference.md",
    "docs/reference/generated/providers.md",
  ], { changeId: "provider-change", generatedAt: "2026-07-28T00:00:00.000Z" });
  assert.equal(report.decision, "ready");
  assert.deepEqual(report.affectedComponents, ["providers"]);
  assert.equal(report.requirements.every((item) => item.status === "pass"), true);
  assert.match(renderDocumentationImpactMarkdown(report), /READY/);
});

test("documentation impact fails closed when code lacks docs or tests", () => {
  const report = analyzeDocumentationImpact(["src/state-engine.js"], { generatedAt: "2026-07-28T00:00:00.000Z" });
  assert.equal(report.decision, "hold");
  assert.deepEqual(report.blockers, ["implementation-documentation-coupling", "implementation-test-coupling", "state-architecture", "state-migration-recovery"]);
});

test("documentation-only changes remain valid without implementation evidence", () => {
  const report = analyzeDocumentationImpact(["docs/faq/index.md", "website/mkdocs.yml"], { generatedAt: "2026-07-28T00:00:00.000Z" });
  assert.equal(report.changeProfile, "documentation");
  assert.deepEqual(report.affectedComponents, []);
  assert.equal(report.decision, "ready");
  assert.equal(validateDocumentationImpactReport(report).valid, true);
});

test("impact report validation rejects forged decisions and malformed requirements", () => {
  const report = analyzeDocumentationImpact(["src/cli.js"], { generatedAt: "invalid" });
  report.decision = "ready";
  report.requirements[0].status = "not-applicable";
  report.requirements.push({ ...report.requirements[0] });
  const validation = validateDocumentationImpactReport(report);
  assert.equal(validation.valid, false);
  assert.match(validation.issues.join("\n"), /generatedAt/);
  assert.match(validation.issues.join("\n"), /unique ID/);
  assert.match(validation.issues.join("\n"), /rationale/);
  assert.match(validation.issues.join("\n"), /decision must be hold/);
});

test("documentation impact requires subsystem-specific evidence", () => {
  const report = analyzeDocumentationImpact(["src/credentials.js", "test/credentials.test.js", "docs/faq/index.md"], { generatedAt: "2026-07-28T00:00:00.000Z" });
  assert.equal(report.decision, "hold");
  assert.deepEqual(report.blockers, ["credential-operations", "credential-security"]);
});

test("documentation impact accepts explicit governed exclusions", () => {
  const report = analyzeDocumentationImpact(["src/state-engine.js", "test/state-engine.test.js", "docs/architecture/enterprise-foundation.md"], {
    generatedAt: "2026-07-28T00:00:00.000Z",
    checkpoint: "merge",
    notApplicable: { "state-migration-recovery": "Internal refactor with no state format or recovery behavior change." },
  });
  assert.equal(report.decision, "ready");
  assert.equal(report.requirements.find((item) => item.id === "state-migration-recovery").status, "not-applicable");
  assert.equal(validateDocumentationImpactReport(report).valid, true);
});
