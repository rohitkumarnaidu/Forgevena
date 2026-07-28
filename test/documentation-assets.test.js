import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runSafeExample, validateDocumentationAssets, validateExecutableExamples, validateVisualEvidence } from "../src/documentation-assets.js";

test("repository visual and executable documentation evidence validates", async () => {
  const report = await validateDocumentationAssets(process.cwd(), { now: new Date("2026-07-28T00:00:00Z") });
  assert.equal(report.valid, true, report.issues.join("\n"));
  assert.equal(report.visual.assetsChecked, 6);
  assert.equal(report.examples.examplesExecuted, 3);
});

test("visual evidence rejects stale hashes, missing alt text, changed sources, and orphaned assets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-visual-"));
  try {
    await mkdir(path.join(root, "docs/assets"), { recursive: true });
    await writeFile(path.join(root, "source.md"), "source\n");
    await writeFile(path.join(root, "docs/assets/known.svg"), "<svg/>\n");
    await writeFile(path.join(root, "docs/assets/orphan.png"), "orphan\n");
    await writeFile(path.join(root, "docs/assets/visual-evidence.json"), JSON.stringify({ schemaVersion: 1, assets: [{ path: "docs/assets/known.svg", type: "diagram", altText: "", productVersion: "1.0.0", reviewedAt: "2026-01-01", reviewBy: "2027-01-01", sha256: "0".repeat(64), sourceDependencies: [{ path: "source.md", sha256: "f".repeat(64) }] }] }));
    const report = await validateVisualEvidence(root, new Date("2026-07-28T00:00:00Z"));
    const issues = report.issues.join("\n");
    assert.match(issues, /missing altText/);
    assert.match(issues, /stale content hash/);
    assert.match(issues, /changed without review/);
    assert.match(issues, /orphaned/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("executable evidence rejects prohibited commands and missing evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-examples-"));
  try {
    await mkdir(path.join(root, "docs/examples"), { recursive: true });
    await writeFile(path.join(root, "docs/examples/executable-evidence.json"), JSON.stringify({ schemaVersion: 1, examples: [{ id: "unsafe", description: "unsafe", executable: "node", args: ["-e", "fetch('https://example.com')"], platforms: [process.platform], timeoutMs: 30000, expectedExitCode: 0, expectedOutputSha256: "", outputContains: [], verifiedAt: "2026-07-28", reviewBy: "2027-01-28" }] }));
    const report = await validateExecutableExamples(root, { execute: true, now: new Date("2026-07-28T00:00:00Z") });
    assert.match(report.issues.join("\n"), /missing expectedOutputSha256|not allowlisted|invalid timeoutMs/);
    assert.equal(report.examplesExecuted, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("safe example execution enforces timeout", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-example-timeout-"));
  try {
    await mkdir(path.join(root, "bin"), { recursive: true });
    await writeFile(path.join(root, "bin/forgevena.js"), "setTimeout(() => {}, 5000);\n");
    await assert.rejects(runSafeExample(root, { args: ["./bin/forgevena.js", "help"], timeoutMs: 100 }), /timed out/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
