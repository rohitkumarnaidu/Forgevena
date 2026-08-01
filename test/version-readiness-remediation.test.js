import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { AUDITED_VERSIONS, normalizeGeneratedMarkdown } from "../src/version-readiness-audit.js";

const root = process.cwd();

function count(text, heading) {
  return (text.match(new RegExp(`^### ${heading} — `, "gm")) ?? []).length;
}

test("all remediation plans cover every owned blocking finding", async () => {
  for (const version of AUDITED_VERSIONS) {
    const directory = path.join(root, "docs", "evidence", "changes", `version-readiness-audit-${version}`);
    const audit = JSON.parse(await readFile(path.join(directory, "audit.json"), "utf8"));
    const remediation = await readFile(path.join(directory, "remediation-plan.md"), "utf8");
    const blockers = audit.findings.filter((finding) => finding.blocking);
    assert.equal(count(remediation, "Documentation Remediation Checklist"), blockers.length);
    assert.equal(count(remediation, "Engineering Remediation Checklist"), blockers.length);
    assert.equal(count(remediation, "Finding Readiness Checklist"), blockers.length);
    for (const finding of blockers) {
      assert.ok(remediation.includes(finding.id));
      assert.ok(remediation.includes(finding.targetDocument));
      assert.ok(remediation.includes(finding.question));
    }
  }
});

test("all-version remediation preserves dependency order and readiness gates", async () => {
  const report = await readFile(path.join(root, "docs", "reports", "VERSION_IMPLEMENTATION_READINESS_REMEDIATION_PLAN.md"), "utf8");
  let prior = -1;
  for (const version of AUDITED_VERSIONS) {
    const current = report.indexOf(`re-audit ${version}`);
    assert.ok(current > prior);
    prior = current;
  }
  assert.match(report, /95\/100/);
  assert.match(report, /100%/);
});

test("generated remediation evidence is current for all and single versions", () => {
  const script = path.join(root, "scripts", "version-readiness-remediation.js");
  const all = JSON.parse(execFileSync(process.execPath, [script, "--all", "--verify"], { cwd: root, encoding: "utf8" }));
  assert.equal(all.valid, true);
  assert.equal(all.versions, 16);
  assert.equal(all.files, 17);
  const single = JSON.parse(execFileSync(process.execPath, [script, "--version", "v2.2.0", "--verify"], { cwd: root, encoding: "utf8" }));
  assert.equal(single.valid, true);
  assert.equal(single.versions, 1);
  assert.equal(single.files, 1);
});

test("generated remediation verification accepts Windows line endings", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "forgevena-remediation-crlf-"));
  try {
    await cp(path.join(root, "docs"), path.join(temporaryRoot, "docs"), { recursive: true });
    const targets = [
      path.join(temporaryRoot, "docs", "evidence", "changes", "version-readiness-audit-v1.4.0", "remediation-plan.md"),
      path.join(temporaryRoot, "docs", "reports", "VERSION_IMPLEMENTATION_READINESS_REMEDIATION_PLAN.md"),
    ];
    for (const target of targets) {
      const contents = await readFile(target, "utf8");
      await writeFile(target, normalizeGeneratedMarkdown(contents).replace(/\n/g, "\r\n"), "utf8");
    }
    const script = path.join(root, "scripts", "version-readiness-remediation.js");
    const result = JSON.parse(execFileSync(process.execPath, [script, "--all", "--verify"], { cwd: temporaryRoot, encoding: "utf8" }));
    assert.equal(result.valid, true);
    assert.equal(result.versions, 16);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("remediation generator can deterministically refresh all retained plans", () => {
  const script = path.join(root, "scripts", "version-readiness-remediation.js");
  const generated = JSON.parse(execFileSync(process.execPath, [script, "--all", "--apply"], { cwd: root, encoding: "utf8" }));
  assert.equal(generated.valid, true);
  assert.equal(generated.mode, "write");
  assert.equal(generated.versions, 16);
  assert.equal(generated.files, 17);
});
