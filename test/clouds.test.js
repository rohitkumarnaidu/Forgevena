import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { cloudActionPlan, cloudRollbackPlan, executeCloudAction, listCloudPlatforms, prepareCloudPlatform, validateCloudPlatform } from "../src/clouds.js";
import { configureCredential } from "../src/credentials.js";

test("all cloud adapters prepare additive artifacts without deploying", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cloud-prepare-"));
  try {
    for (const { name } of listCloudPlatforms()) {
      const prepared = await prepareCloudPlatform(root, name, { dryRun: false });
      assert.equal(prepared.deploymentAutomatic, false);
      assert.equal(prepared.prepared, true);
      assert.ok((await validateCloudPlatform(root, name)).prepared);
      assert.ok((await prepareCloudPlatform(root, name, { dryRun: false })).skipped.length >= 2);
      assert.equal((await cloudRollbackPlan(root, name)).automaticDeletion, false);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("cloud execution paths inject credentials without returning them", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cloud-execute-"));
  try {
    await prepareCloudPlatform(root, "vercel", { dryRun: false });
    await configureCredential(root, "vercel", "vercel-secret", { dryRun: false });
    const locator = async (file, _args, options) => file === (process.platform === "win32" ? "where.exe" : "which") ? { stdout: "vercel", stderr: "" } : { stdout: "demo-user", stderr: "" };
    const plan = await cloudActionPlan(root, "vercel", "verify", { execImpl: locator });
    let token;
    const result = await executeCloudAction(root, plan, { execImpl: async (_file, _args, options) => { token = options.env.VERCEL_TOKEN; return { stdout: "demo-user", stderr: "" }; } });
    assert.equal(token, "vercel-secret");
    assert.equal(result.executed, true);
    assert.doesNotMatch(JSON.stringify(result), /vercel-secret/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("every cloud exposes verify, deploy, and status preflight plans", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cloud-plans-"));
  const locator = async () => ({ stdout: "found", stderr: "" });
  try {
    for (const { name } of listCloudPlatforms()) {
      await prepareCloudPlatform(root, name, { dryRun: false });
      await configureCredential(root, name, `${name}-secret`, { dryRun: false });
      for (const action of ["verify", "deploy", "status"]) {
        const plan = await cloudActionPlan(root, name, action, { execImpl: locator });
        if (name === "aws" && action === "deploy") {
          assert.equal(plan.ready, false);
          assert.deepEqual(plan.blockers, ["account-specific-deployment-input"]);
        } else {
          assert.equal(plan.ready, true);
          assert.ok(plan.args.length > 0);
        }
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
