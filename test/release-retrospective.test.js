import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateReleaseRetrospective, renderReleaseRetrospective, validateReleaseRetrospectives } from "../src/release-retrospective.js";

const ledger = JSON.parse(await readFile(new URL("../docs/governance/release-retrospectives.json", import.meta.url), "utf8"));

test("historical release ledger validates every stable tag", () => {
  const report = validateReleaseRetrospectives(ledger);
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.releasesChecked, 5);
});

test("retrospective scoring cannot silently certify historical evidence", () => {
  const release = structuredClone(ledger.releases.find(({ tag }) => tag === "v1.3.0"));
  assert.equal(calculateReleaseRetrospective(release).score, 100);
  assert.equal(release.decision, "historical-assurance");
  release.decision = "current-certified";
  assert.match(validateReleaseRetrospectives({ ...ledger, releases: ledger.releases.map((item) => item.tag === release.tag ? release : item) }).issues.join("\n"), /cannot be current-certified/);
});

test("future releases fail closed without current governance evidence", () => {
  const release = structuredClone(ledger.releases.find(({ tag }) => tag === "v1.3.0"));
  release.tag = "v1.3.1";
  release.commit = "a".repeat(40);
  const document = { ...ledger, expectedStableTags: [...ledger.expectedStableTags.filter((tag) => tag !== "v1.3.0"), "v1.3.1"], releases: [...ledger.releases.filter(({ tag }) => tag !== "v1.3.0"), release] };
  const issues = validateReleaseRetrospectives(document).issues.join("\n");
  assert.match(issues, /must be current-certified/);
});

test("generated retrospective states historical limitations explicitly", () => {
  const report = renderReleaseRetrospective(ledger);
  assert.match(report, /without rewriting history/);
  assert.match(report, /v1\.2\.2.*failed-as-recorded/);
  assert.match(report, /v1\.3\.0.*historical-assurance/);
});

test("retrospective scoring handles partial, excluded, and empty controls", () => {
  assert.deepEqual(calculateReleaseRetrospective({ controls: [] }), { applicablePoints: 0, earnedPoints: 0, score: 0, mandatoryFailures: [] });
  const calculated = calculateReleaseRetrospective({ controls: [
    { id: "pass", weight: 40, mandatory: true, status: "pass" },
    { id: "partial", weight: 20, mandatory: false, status: "partial" },
    { id: "unknown", weight: 20, mandatory: true, status: "unknown" },
    { id: "excluded", weight: 20, mandatory: true, status: "not-applicable" },
  ] });
  assert.deepEqual(calculated, { applicablePoints: 80, earnedPoints: 50, score: 62, mandatoryFailures: ["unknown"] });
});

test("malformed retrospective ledgers fail closed", () => {
  assert.match(validateReleaseRetrospectives(null).issues.join("\n"), /must be an object/);
  const malformed = { schemaVersion: 2, policyEffectiveFrom: "next", assessedAt: "invalid", owner: "", expectedStableTags: [], releases: [] };
  const issues = validateReleaseRetrospectives(malformed).issues.join("\n");
  for (const expected of ["schemaVersion", "policyEffectiveFrom", "assessedAt", "owner", "expectedStableTags", "releases"]) assert.match(issues, new RegExp(expected));
});

test("release records reject malformed metadata and calculations", () => {
  const document = structuredClone(ledger);
  const release = document.releases[0];
  release.tag = "1.2";
  release.commit = "short";
  release.outcome = "invented";
  release.decision = "approved";
  release.summary = "";
  release.findings = "none";
  release.totals = { applicablePoints: 1, earnedPoints: 1, score: 1, mandatoryFailures: [] };
  document.expectedStableTags[0] = "1.2";
  const issues = validateReleaseRetrospectives(document).issues.join("\n");
  for (const expected of ["stable vX.Y.Z", "full commit SHA", "unsupported outcome", "unsupported decision", "requires a summary", "findings must be an array", "totals.applicablePoints", "totals.earnedPoints", "totals.score", "mandatoryFailures"]) assert.match(issues, new RegExp(expected));
});

test("control contracts reject missing, duplicated, unsupported, and evidence-free records", () => {
  const document = structuredClone(ledger);
  const release = document.releases[1];
  release.controls[0] = { ...release.controls[1], weight: 99, mandatory: "yes", status: "maybe", rationale: "", evidence: [] };
  release.controls[2] = { ...release.controls[2], status: "fail", evidence: [] };
  const issues = validateReleaseRetrospectives(document).issues.join("\n");
  for (const expected of ["missing control source-integrity", "duplicates control release-automation", "must have weight", "mandatory must be boolean", "unsupported status", "requires a rationale", "requires evidence"]) assert.match(issues, new RegExp(expected));
});

test("ledger completeness and publication decisions are enforced", () => {
  const duplicate = structuredClone(ledger);
  duplicate.releases[1].tag = duplicate.releases[0].tag;
  let issues = validateReleaseRetrospectives(duplicate).issues.join("\n");
  assert.match(issues, /duplicated/);
  assert.match(issues, /has no retrospective assessment/);

  const extra = structuredClone(ledger);
  extra.expectedStableTags.pop();
  issues = validateReleaseRetrospectives(extra).issues.join("\n");
  assert.match(issues, /missing from expectedStableTags/);

  const failed = structuredClone(ledger);
  failed.releases[0].decision = "not-certified";
  issues = validateReleaseRetrospectives(failed).issues.join("\n");
  assert.match(issues, /Failed publication.*failed-as-recorded/);

  const published = structuredClone(ledger);
  published.releases[1].decision = "failed-as-recorded";
  issues = validateReleaseRetrospectives(published).issues.join("\n");
  assert.match(issues, /Published release.*cannot use failed-as-recorded/);
});

test("current certification requires complete current-policy evidence", () => {
  const release = structuredClone(ledger.releases.at(-1));
  release.tag = "v2.0.0";
  release.commit = "b".repeat(40);
  release.decision = "current-certified";
  const document = { ...ledger, expectedStableTags: [...ledger.expectedStableTags, release.tag], releases: [...ledger.releases, release] };
  const issues = validateReleaseRetrospectives(document).issues.join("\n");
  assert.match(issues, /cannot be current-certified/);
});

test("empty findings render a clear retrospective result", () => {
  const document = structuredClone(ledger);
  for (const release of document.releases) release.findings = [];
  assert.match(renderReleaseRetrospective(document), /No unresolved retrospective findings/);
});
