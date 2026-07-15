import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initializeProject } from "../src/project.js";
import { validateBootstrap } from "../src/bootstrap-validator.js";

test("enterprise project bootstrap passes validation", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-bootstrap-"));
  const project = path.join(root, "project");
  try {
    await initializeProject(project, { dryRun: false, createProject: true, projectName: "project", template: "enterprise" });
    assert.equal((await validateBootstrap(project)).valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("existing project initialization validates its additive baseline", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-bootstrap-existing-"));
  try {
    await initializeProject(root, { dryRun: false });
    const result = await validateBootstrap(root);
    assert.equal(result.mode, "existing-project");
    assert.equal(result.valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
