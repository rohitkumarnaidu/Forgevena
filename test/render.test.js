import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { initializeProject } from "../src/project.js";
import { configureRender, executeRenderDeployment, executeRenderStatus, generateRenderBlueprint, renderDeploymentPlan, renderRollbackPlan, validateRenderBlueprint } from "../src/render.js";

const execute = promisify(execFile);

test("Render Blueprint generation is additive and secret-reference only", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "render-blueprint-"));
  try {
    await initializeProject(root, { dryRun: false, createProject: true, projectName: "Demo API", template: "fastapi" });
    assert.equal((await generateRenderBlueprint(root, { dryRun: false })).blueprintGenerated, true);
    const blueprint = await readFile(path.join(root, "render.yaml"), "utf8");
    assert.match(blueprint, /runtime: docker/);
    assert.match(blueprint, /OPENAI_API_KEY\n\s+sync: false/);
    assert.doesNotMatch(blueprint, /sk-/);
    const validation = await validateRenderBlueprint(root);
    assert.equal(validation.valid, true);
    assert.equal(validation.repositoryReady, false);
    assert.equal((await generateRenderBlueprint(root, { dryRun: false })).skipped[0], "render.yaml");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Render deploy requires Git readiness, registered services, and an external token", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "render-deploy-"));
  const previous = process.env.RENDER_API_KEY;
  process.env.RENDER_API_KEY = "render-secret";
  try {
    await initializeProject(root, { dryRun: false, createProject: true, projectName: "Demo", template: "express" });
    await generateRenderBlueprint(root, { dryRun: false });
    await execute("git", ["init"], { cwd: root });
    await execute("git", ["remote", "add", "origin", "git@github.com:example/demo.git"], { cwd: root });
    await configureRender(root, { serviceIds: ["srv_test"], workspaceId: "tea_test", dryRun: false });
    const plan = await renderDeploymentPlan(root, "deploy");
    assert.equal(plan.executable, true);
    assert.match(plan.deeplink, /https%3A%2F%2Fgithub.com%2Fexample%2Fdemo/);
    let authorization;
    const result = await executeRenderDeployment(root, plan, { fetchImpl: async (_url, options) => { authorization = options.headers.authorization; return new Response(JSON.stringify({ id: "dep_test", status: "build_in_progress" }), { status: 201 }); } });
    assert.equal(result.deployments[0].deployId, "dep_test");
    assert.equal(authorization, "Bearer render-secret");
    assert.doesNotMatch(await readFile(path.join(root, ".ai-workspace", "cloud", "render.json"), "utf8"), /render-secret/);
  } finally {
    if (previous === undefined) delete process.env.RENDER_API_KEY; else process.env.RENDER_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("Render deployment retries transient API failures", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "render-retry-"));
  const previous = process.env.RENDER_API_KEY;
  process.env.RENDER_API_KEY = "render-secret";
  let calls = 0;
  try {
    const plan = { executable: true, serviceIds: ["srv_retry"] };
    const result = await executeRenderDeployment(root, plan, { fetchImpl: async () => { calls += 1; return calls < 3 ? new Response(JSON.stringify({ message: "busy" }), { status: 503 }) : new Response(JSON.stringify({ id: "dep_ok", status: "build_in_progress" }), { status: 201 }); } });
    assert.equal(calls, 3);
    assert.equal(result.deployments[0].deployId, "dep_ok");
  } finally { if (previous === undefined) delete process.env.RENDER_API_KEY; else process.env.RENDER_API_KEY = previous; await rm(root, { recursive: true, force: true }); }
});

test("Render Blueprint templates and validation failures are deterministic", async () => {
  for (const template of ["react", "full-stack-ai", "microservices", "nextjs", "flutter"]) {
    const root = await mkdtemp(path.join(tmpdir(), `render-${template}-`));
    try {
      await mkdir(path.join(root, ".ai-workspace"), { recursive: true });
      await writeFile(path.join(root, ".ai-workspace", "workspace.json"), JSON.stringify({ schemaVersion: 2, workspaceVersion: "1.2.3", template, projectName: "Demo Project" }));
      assert.equal((await generateRenderBlueprint(root)).dryRun, true);
      await generateRenderBlueprint(root, { dryRun: false });
      assert.match(await readFile(path.join(root, "render.yaml"), "utf8"), /^services:/);
    } finally { await rm(root, { recursive: true, force: true }); }
  }

  const root = await mkdtemp(path.join(tmpdir(), "render-invalid-"));
  try {
    assert.equal((await validateRenderBlueprint(root)).valid, false);
    await mkdir(path.join(root, ".ai-workspace"), { recursive: true });
    await writeFile(path.join(root, ".ai-workspace", "workspace.json"), JSON.stringify({ schemaVersion: 2, workspaceVersion: "1.2.3", template: "blank", projectName: "---" }));
    await assert.rejects(() => generateRenderBlueprint(root, { dryRun: false }), /does not define/);
    await writeFile(path.join(root, "render.yaml"), "services:\n  - type: web\n    runtime: docker\n    envVars:\n      - key: API_KEY\n        value: exposed\n");
    const validation = await validateRenderBlueprint(root);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.length >= 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Render configuration, status, failures, and rollback stay explicit", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "render-lifecycle-"));
  const previous = process.env.RENDER_API_KEY;
  try {
    const preview = await configureRender(root, { serviceIds: [" srv_a ", "srv_a", "", "srv_b"] });
    assert.deepEqual(preview.serviceIds, ["srv_a", "srv_b"]);
    await configureRender(root, { serviceIds: ["srv_a"], dryRun: false });
    assert.equal((await renderRollbackPlan(root)).automaticDeletion, false);
    assert.equal((await executeRenderDeployment(root, { executable: false })).executed, false);
    assert.equal((await executeRenderStatus(root, { executable: false })).executed, false);
    delete process.env.RENDER_API_KEY;
    await assert.rejects(() => executeRenderDeployment(root, { executable: true, serviceIds: ["srv_a"] }), /Missing RENDER_API_KEY/);
    await assert.rejects(() => executeRenderStatus(root, { executable: true, serviceIds: ["srv_a"] }), /Missing RENDER_API_KEY/);
    process.env.RENDER_API_KEY = "render-secret";
    await assert.rejects(() => executeRenderDeployment(root, { executable: true, serviceIds: ["srv_a"] }, { fetchImpl: async () => new Response(JSON.stringify({ message: "denied" }), { status: 400 }) }), /denied/);
    await assert.rejects(() => executeRenderStatus(root, { executable: true, serviceIds: ["srv_a"] }, { fetchImpl: async () => new Response(JSON.stringify({ message: "denied" }), { status: 400 }) }), /denied/);
    const arrayStatus = await executeRenderStatus(root, { executable: true, serviceIds: ["srv_a"] }, { fetchImpl: async () => new Response(JSON.stringify([{ id: "dep", status: "live" }]), { status: 200 }) });
    assert.equal(arrayStatus.services[0].latestDeploy.status, "live");
    const emptyStatus = await executeRenderStatus(root, { executable: true, serviceIds: ["srv_a"] }, { fetchImpl: async () => new Response(JSON.stringify([]), { status: 200 }) });
    assert.equal(emptyStatus.services[0].latestDeploy, null);
  } finally {
    if (previous === undefined) delete process.env.RENDER_API_KEY; else process.env.RENDER_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});
