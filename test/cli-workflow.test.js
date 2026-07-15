import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initializeProject, rollbackProject } from "../src/project.js";
import { readStatus } from "../src/project.js";

test("status reports uninitialized directories accurately", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-project-"));
  try {
    assert.equal((await readStatus(root)).initialized, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("new project bootstrap creates additive assets and a registry", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-project-"));
  const target = path.join(root, "example");
  try {
    const result = await initializeProject(target, { dryRun: false, createProject: true, projectName: "example" });
    assert.ok(result.created.includes("README.md"));
    const registry = JSON.parse(await readFile(path.join(target, ".ai-workspace", "workspace.json"), "utf8"));
    assert.equal(registry.projectName, "example");
    assert.ok(registry.modules.includes("core"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rollback previews without restoring the registry", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-project-"));
  try {
    await initializeProject(root, { dryRun: false });
    await initializeProject(root, { dryRun: false });
    const result = await rollbackProject(root, undefined, { dryRun: true });
    assert.equal(result.dryRun, true);
    assert.match(result.confirmation, /Preview only/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
