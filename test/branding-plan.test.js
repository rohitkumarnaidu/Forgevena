import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("branding discovery contains at least thirty evaluated candidates", async () => {
  const report = await readFile("docs/branding/BRAND_DISCOVERY.md", "utf8");
  const candidates = report.split(/\r?\n/).filter((line) => /^\| \*\*[^*]+\*\* \|/.test(line));
  assert.ok(candidates.length >= 30, `expected at least 30 candidates, found ${candidates.length}`);
  assert.match(report, /approved compatibility-release identity is \*\*Forgevena\*\*/);
  assert.match(report, /does not prove/i);
});

test("Forgevena rename is approved and backward compatible", async () => {
  const plan = await readFile("docs/branding/RENAME_PLAN.md", "utf8");
  assert.match(plan, /approved and implemented for version 1\.1/i);
  assert.match(plan, /Forgevena/);
  assert.match(plan, /ai-workspace.*deprecated alias/i);
  assert.match(plan, /\.ai-workspace/);
});

test("package exposes preferred and legacy executable identities", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(packageJson.name, "forgevena");
  assert.equal(packageJson.bin.forgevena, "./bin/forgevena.js");
  assert.equal(packageJson.bin["ai-workspace"], "./bin/ai-workspace.js");
});
