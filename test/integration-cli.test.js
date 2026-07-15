import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { initializeProject, rollbackProject } from "../src/project.js";
import { moduleContract } from "../src/modules.js";
import { initializeIntegrationProject, manageIntegration, recordIntegration } from "../src/integrations.js";

const execute = promisify(execFile);
const cli = path.resolve("bin", "ai-workspace.js");

test("CLI previews external install and reference actions without side effects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-preview-"));
  try {
    const install = JSON.parse((await execute("node", [cli, "install", "openspec"], { cwd: root })).stdout);
    const reference = JSON.parse((await execute("node", [cli, "reference", "design-md"], { cwd: root })).stdout);
    assert.equal(install.dryRun, true);
    assert.equal(install.approval.reason, "preview");
    assert.equal(reference.dryRun, true);
    assert.equal(reference.approval.reason, "preview");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("verbose CLI output includes execution diagnostics", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-verbose-"));
  try {
    const output = JSON.parse((await execute("node", [cli, "templates", "--verbose"], { cwd: root })).stdout);
    assert.ok(output.result.templates.includes("flutter"));
    assert.equal(output.diagnostics.dryRun, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("integration lifecycle persists project state and generated guidance", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "integration-lifecycle-"));
  try {
    await initializeProject(root, { dryRun: false });
    assert.equal((await recordIntegration(root, "openspec", { dryRun: false })).registered, true);
    assert.ok((await initializeIntegrationProject(root, "openspec", { dryRun: false })).created.includes("docs/integrations/openspec.md"));
    assert.equal((await manageIntegration(root, "validate", "openspec", { dryRun: false })).registryUpdated, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("module lifecycle validation reports missing module assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "module-lifecycle-"));
  try {
    const result = await moduleContract("design").validate(root);
    assert.equal(result.valid, false);
    assert.ok(result.missing.includes("DESIGN.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rollback requires latest operation order", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rollback-order-"));
  try {
    const first = await initializeProject(root, { dryRun: false });
    const second = await initializeProject(root, { dryRun: false });
    await assert.rejects(() => rollbackProject(root, first.transaction, { dryRun: true }), /latest managed operation/);
    assert.equal((await rollbackProject(root, second.transaction, { dryRun: true })).operation, second.transaction);
  } finally { await rm(root, { recursive: true, force: true }); }
});
