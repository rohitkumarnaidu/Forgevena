import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runStableReleaseGate, verifyStableReleaseGate } from "../src/stable-release-gate.js";

const now = new Date("2026-10-03T12:00:00Z");

test("stable release gate reports the current record as HOLD without failing hold-aware inspection", async () => {
  const root = process.cwd();
  const result = await runStableReleaseGate(root, { allowHold: true, now });
  assert.equal(result.decision, "hold");
  assert.equal(result.valid, false);
  assert.equal(result.accepted, true);
  assert.ok(result.issues.some((issue) => issue.includes("openai")));
});

test("stable release readiness schema permits its canonical schema declaration", async () => {
  const schema = JSON.parse(await readFile(path.join(process.cwd(), "docs/reference/schemas/stable-release-readiness.schema.json"), "utf8"));
  const instance = JSON.parse(await readFile(path.join(process.cwd(), "docs/evidence/releases/v1.4.0/stable-release-readiness.json"), "utf8"));
  assert.equal(schema.additionalProperties, false);
  assert.ok(Object.hasOwn(schema.properties, "$schema"));
  for (const property of Object.keys(instance)) assert.ok(Object.hasOwn(schema.properties, property), `schema must allow ${property}`);
});

test("stable release gate accepts complete, fresh evidence and exact six-job lifecycle matrix", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "stable-release-gate-"));
  try {
    const record = completeRecord();
    await writeEvidence(root, record);
    await writeFile(path.join(root, "docs/evidence/releases/v1.4.0/stable-release-readiness.json"), JSON.stringify(record));
    const result = await verifyStableReleaseGate(root, { now });
    assert.equal(result.valid, true, result.issues.join("\n"));
    assert.equal(result.decision, "ready");
    assert.equal(result.matrixJobs, 6);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("stable release gate rejects missing matrix jobs, stale evidence, and unapproved promotion", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "stable-release-gate-negative-"));
  try {
    const record = completeRecord();
    record.preTagRehearsal.matrix.pop();
    record.providerEvidence[0].expiresAt = "2026-10-02T00:00:00Z";
    record.approval.ownerApproved = false;
    await writeEvidence(root, record);
    await writeFile(path.join(root, "docs/evidence/releases/v1.4.0/stable-release-readiness.json"), JSON.stringify(record));
    const result = await verifyStableReleaseGate(root, { now });
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.includes("Windows, Linux, and macOS")));
    assert.ok(result.issues.some((issue) => issue.includes("expired")));
    assert.ok(result.issues.some((issue) => issue.includes("owner release approval")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

function completeRecord() {
  const evidencePath = "docs/evidence/test/verified.json";
  const artifactSha256 = "b".repeat(64);
  const workflowRunId = 123;
  const commit = "a".repeat(40);
  const matrix = [
    ["ubuntu-latest", 20], ["ubuntu-latest", 22], ["windows-latest", 20],
    ["windows-latest", 22], ["macos-15-intel", 20], ["macos-15-intel", 22],
  ].map(([osName, node]) => ({ os: osName, node, status: "passed", evidencePath: `docs/evidence/test/lifecycle-${osName}-${node}.json` }));
  return {
    schemaVersion: 1, version: "1.4.0", candidateTag: "v1.4.0-rc.3", decision: "ready", blockers: [],
    providerEvidence: ["openai", "claude", "gemini", "openrouter", "ollama"].map((provider) => ({ provider, status: "passed", model: "pinned-model", verifiedAt: "2026-10-02T00:00:00Z", expiresAt: provider === "ollama" ? "2027-03-31T00:00:00Z" : "2026-12-31T00:00:00Z", evidencePath, limitations: [] })),
    preTagRehearsal: { status: "passed", candidateTag: "v1.4.0-rc.3", workflowRunUrl: "https://github.com/owner/repo/actions/runs/123", workflowRunId, commit, completedAt: "2026-10-03T10:00:00Z", artifactSha256, matrix, scenarios: ["clean-install", "upgrade-migration", "rollback", "offline-install", "cancellation", "uninstall", "workspace-preservation"].map((name) => ({ name, status: "passed", evidencePath: matrix[0].evidencePath })) },
    qualityGates: { criticalPercent: 100, importantPercent: 95, standardPercent: 90, blockerCount: 0, scorecardPath: "docs/evidence/test/scorecard.md" },
    approval: { ownerApproved: true, approver: "release-owner", approvedAt: "2026-10-03T11:00:00Z", reviewRecord: "PR #999" },
  };
}

async function writeEvidence(root, record) {
  await mkdir(path.join(root, "docs/evidence/test"), { recursive: true });
  await writeFile(path.join(root, "docs/evidence/test/verified.json"), JSON.stringify({ safe: true }));
  for (const item of record.preTagRehearsal.matrix) {
    await writeFile(path.join(root, item.evidencePath), JSON.stringify({
      schemaVersion: 1,
      candidateTag: record.candidateTag,
      os: item.os,
      node: item.node,
      status: "passed",
      checksumVerified: true,
      artifactSha256: record.preTagRehearsal.artifactSha256,
      baselineVersion: "1.3.0",
      candidateVersion: record.candidateTag.slice(1),
      offlineVersion: record.candidateTag.slice(1),
      workflowRunId: record.preTagRehearsal.workflowRunId,
      commit: record.preTagRehearsal.commit,
      secretsRetained: false,
      scenarios: ["clean-install", "upgrade-migration", "rollback", "offline-install", "cancellation", "uninstall", "workspace-preservation"],
    }));
  }
  await writeFile(path.join(root, "docs/evidence/test/scorecard.md"), "**Decision: READY**\n\nCritical controls 100%\nImportant controls 95%\nStandard controls 90%\nOutstanding mandatory blockers: 0\n");
  await mkdir(path.dirname(path.join(root, "docs/evidence/releases/v1.4.0/stable-release-readiness.json")), { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({ version: "1.4.0" }));
}
