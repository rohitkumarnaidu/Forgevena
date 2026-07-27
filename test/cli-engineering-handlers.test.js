import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { copilotCommand, indexCommand, semanticCommand, skillsCommand, workflowsCommand } from "../src/cli/handlers/engineering.js";

async function workspace(prefix, callback) {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  try { return await callback(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("skills handler exposes stable subject and action validation", () => workspace("skills-handler-", async (root) => {
  assert.deepEqual((await skillsCommand(root, ["list"], { dryRun: true })).assets, []);
  await assert.rejects(() => skillsCommand(root, ["trust"], { dryRun: true }), { code: "CLI_SKILL_PUBLISHER_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["trust", "publisher"], { dryRun: true }), { code: "CLI_SKILL_PUBLIC_KEY_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["verify"], { dryRun: true }), { code: "CLI_SKILL_MANIFEST_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["install"], { dryRun: true }), { code: "CLI_SKILL_MANIFEST_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["status", "skill"], { dryRun: true }), { code: "CLI_SKILL_ID_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["remove", "skill"], { dryRun: true }), { code: "CLI_SKILL_ID_REQUIRED" });
  await assert.rejects(() => skillsCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_SKILL_ACTION_INVALID" });
}));

test("workflow handler validates, plans, previews, and reports usage errors", () => workspace("workflow-handler-", async (root) => {
  const filename = path.join(root, "workflow.json");
  await writeFile(filename, JSON.stringify({ schemaVersion: 1, id: "review", version: "1.0.0", nodes: [{ id: "inspect", action: "noop" }, { id: "approve", type: "consent", action: "emit", dependsOn: ["inspect"] }] }));
  assert.equal((await workflowsCommand(root, ["validate", "workflow.json"], { dryRun: true })).valid, true);
  assert.deepEqual((await workflowsCommand(root, ["plan", "workflow.json"], { dryRun: true })).order, ["inspect", "approve"]);
  assert.equal((await workflowsCommand(root, ["run", "workflow.json", "--run-id", "preview", "--approve", "approve"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => workflowsCommand(root, ["validate"], { dryRun: true }), { code: "CLI_WORKFLOW_REQUIRED" });
  await assert.rejects(() => workflowsCommand(root, ["run"], { dryRun: true }), { code: "CLI_WORKFLOW_REQUIRED" });
  await assert.rejects(() => workflowsCommand(root, ["status"], { dryRun: true }), { code: "CLI_WORKFLOW_RUN_REQUIRED" });
  await assert.rejects(() => workflowsCommand(root, ["resume"], { dryRun: true }), { code: "CLI_WORKFLOW_RUN_REQUIRED" });
  await assert.rejects(() => workflowsCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_WORKFLOW_ACTION_INVALID" });
}));

test("index and semantic handlers preserve metadata-only previews", () => workspace("index-handler-", async (root) => {
  await writeFile(path.join(root, "README.md"), "# Example\n");
  assert.equal((await indexCommand(root, ["build"], { dryRun: true })).contentStored, false);
  assert.equal((await indexCommand(root, ["build"], { dryRun: false })).indexed, true);
  assert.equal((await indexCommand(root, ["status"], { dryRun: true })).indexed, true);
  assert.equal((await indexCommand(root, ["query", "README"], { dryRun: true })).results[0].type, "file");
  assert.ok((await indexCommand(root, ["recommend"], { dryRun: true })).recommendations);
  await assert.rejects(() => indexCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_INDEX_ACTION_INVALID" });

  assert.equal((await semanticCommand(root, ["configure", "--enabled", "true", "--provider", "ollama", "--metadata", "path,kind"], { dryRun: true })).dryRun, true);
  assert.equal((await semanticCommand(root, ["status"], { dryRun: true })).storesSourceContent, false);
  assert.equal((await semanticCommand(root, ["plan", "--action", "query"], { dryRun: true })).action, "query");
  assert.equal((await semanticCommand(root, ["build"], { dryRun: true })).dryRun, true);
  assert.equal((await semanticCommand(root, ["query", "README"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => semanticCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_SEMANTIC_ACTION_INVALID" });
}));

test("copilot handler remains planning-only without approval", () => workspace("copilot-handler-", async (root) => {
  await writeFile(path.join(root, "README.md"), "# Example\n");
  await indexCommand(root, ["build"], { dryRun: false });
  const plan = await copilotCommand(root, ["plan", "review", "architecture"], { dryRun: true });
  assert.equal(plan.readOnly, true);
  const preview = await copilotCommand(root, ["run", "review", "architecture"], { dryRun: true });
  assert.equal(preview.dryRun, true);
  await assert.rejects(() => copilotCommand(root, ["unknown", "review"], { dryRun: true }), { code: "CLI_COPILOT_ACTION_INVALID" });
}));
