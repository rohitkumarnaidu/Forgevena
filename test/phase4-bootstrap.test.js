import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initializeProject, rollbackProject } from "../src/project.js";

test("template and provider are persisted for new projects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "phase4-"));
  const project = path.join(root, "app");
  try {
    await initializeProject(project, { dryRun: false, createProject: true, projectName: "app", template: "fastapi", provider: "codex" });
    const registry = JSON.parse(await readFile(path.join(project, ".ai-workspace", "workspace.json"), "utf8"));
    assert.equal(registry.template, "fastapi");
    assert.ok(registry.providers.includes("codex"));
    assert.match(await readFile(path.join(project, "pyproject.toml"), "utf8"), /fastapi/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("initialization preserves existing application manifests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "phase4-"));
  try {
    await writeFile(path.join(root, "package.json"), "{\"name\":\"existing\"}\n");
    const result = await initializeProject(root, { dryRun: false, createProject: false });
    assert.equal(await readFile(path.join(root, "package.json"), "utf8"), "{\"name\":\"existing\"}\n");
    assert.equal(result.projectReport.mode, "existing-project");
    await initializeProject(root, { dryRun: false, createProject: false });
    assert.equal((await rollbackProject(root, undefined, { dryRun: true })).dryRun, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("create rejects non-empty destinations instead of adding application files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "phase4-"));
  try {
    await writeFile(path.join(root, "package.json"), "{\"name\":\"existing\"}\n");
    await assert.rejects(() => initializeProject(root, { dryRun: false, createProject: true, template: "react" }), /destination is not empty/);
    assert.equal(await readFile(path.join(root, "package.json"), "utf8"), "{\"name\":\"existing\"}\n");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("merge and skip options are explicit and never overwrite files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "phase4-"));
  const project = path.join(root, "app");
  try {
    const preview = await initializeProject(project, { dryRun: true, createProject: true, template: "fastapi", mergePolicy: "replace", skip: ["Dockerfile", "module:monitoring"] });
    assert.equal(preview.merge.effective, "skip");
    assert.ok(preview.ignored.includes("Dockerfile"));
    assert.ok(!preview.modules.includes("monitoring"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

for (const [template, expectedFiles] of Object.entries({
  react: ["src/main.tsx", "Dockerfile", ".github/workflows/ci.yml"],
  nextjs: ["app/page.tsx", "Dockerfile", ".github/workflows/ci.yml"],
  fastapi: ["src/app/main.py", "Dockerfile", ".github/workflows/ci.yml"],
  express: ["src/server.ts", "Dockerfile", ".github/workflows/ci.yml"],
  python: ["src/app/main.py", "Dockerfile", ".github/workflows/ci.yml"],
})) {
  test(`${template} template generates stack-owned Docker and CI assets`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "phase4-stack-"));
    const project = path.join(root, "app");
    try {
      const result = await initializeProject(project, { dryRun: false, createProject: true, template });
      assert.equal(result.validation.valid, true);
      for (const relative of expectedFiles) await readFile(path.join(project, relative), "utf8");
      const dockerfile = await readFile(path.join(project, "Dockerfile"), "utf8");
      assert.doesNotMatch(dockerfile, /FROM scratch/);
      const workflow = await readFile(path.join(project, ".github", "workflows", "ci.yml"), "utf8");
      assert.doesNotMatch(workflow, /Configure stack-specific/);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}

for (const template of ["flutter", "ai-agent", "rag", "full-stack-ai", "microservices", "library", "cli", "blank", "enterprise"]) {
  test(`${template} template creates a validated project`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "phase4-template-"));
    const project = path.join(root, "app");
    try {
      const result = await initializeProject(project, { dryRun: false, createProject: true, template });
      assert.equal(result.validation.valid, true);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}
