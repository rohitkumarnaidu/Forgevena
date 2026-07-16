import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { initializeProject } from "../src/project.js";
import { configureRender, executeRenderDeployment, generateRenderBlueprint, renderDeploymentPlan, validateRenderBlueprint } from "../src/render.js";

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
