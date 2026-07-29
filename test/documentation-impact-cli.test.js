import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const temporaryRoot = process.env.FORGEVENA_TEST_TMPDIR || path.resolve("cache", "test-tmp");

test("documentation impact CLI imports governed not-applicable rationales", async () => {
  const directory = path.join(temporaryRoot, "documentation-impact-cli-valid");
  await mkdir(directory, { recursive: true });
  const reportPath = path.join(directory, "documentation-impact.json");
  await writeFile(reportPath, JSON.stringify({
    schemaVersion: 2,
    checkpoint: "merge",
    requirements: [
      { id: "cli-user-reference", status: "not-applicable", rationale: "No supported CLI behavior changed." },
      { id: "implementation-test-coupling", status: "fail", rationale: "A failed item cannot be imported as an exclusion." },
    ],
  }), "utf8");

  const output = execFileSync(process.execPath, [
    "scripts/documentation-impact.js",
    "--files", "src/cli.js,test/documentation-impact.test.js,docs/reference/generated/cli.md",
    "--checkpoint", "merge",
    "--not-applicable-file", reportPath,
  ], { cwd: process.cwd(), encoding: "utf8" });
  const report = JSON.parse(output);
  assert.equal(report.requirements.find((item) => item.id === "cli-user-reference").status, "not-applicable");
  assert.notEqual(report.requirements.find((item) => item.id === "implementation-test-coupling").status, "not-applicable");
});

test("documentation impact CLI rejects mismatched evidence checkpoints", async () => {
  const directory = path.join(temporaryRoot, "documentation-impact-cli-invalid");
  await mkdir(directory, { recursive: true });
  const reportPath = path.join(directory, "documentation-impact.json");
  await writeFile(reportPath, JSON.stringify({ schemaVersion: 2, checkpoint: "push", requirements: [] }), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/documentation-impact.js",
    "--files", "docs/faq/index.md",
    "--checkpoint", "merge",
    "--not-applicable-file", reportPath,
  ], { cwd: process.cwd(), encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match merge/);
});
