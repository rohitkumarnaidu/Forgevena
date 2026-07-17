import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { engineeringCopilotPlan, runEngineeringCopilot } from "../src/engineering-copilot.js";
import { buildProjectIndex } from "../src/project-index.js";

test("engineering copilot sends approved metadata and remains read-only", async () => {
  const root = await project();
  try {
    let captured;
    const plan = await engineeringCopilotPlan(root, "Improve release reliability", { provider: "ollama" });
    assert.equal(plan.readOnly, true);
    assert.equal(plan.context.contentIncluded, false);
    const result = await runEngineeringCopilot(root, "Improve release reliability", { provider: "ollama" }, { policyStatusImpl: async () => ({ configured: false }), invokeImpl: async (_root, provider, request) => { captured = request; return { provider, model: "test", text: "Plan", usage: null }; } });
    assert.equal(result.projectFilesChanged, false);
    assert.equal(result.responseStored, false);
    assert.equal(result.sourceContentSent, false);
    assert.equal(captured.prompt.includes("private-source-content"), false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("engineering copilot enforces configured organization policy", async () => {
  const root = await project();
  try {
    await assert.rejects(() => runEngineeringCopilot(root, "Plan tests", { provider: "ollama", principal: "dev@example.com" }, { policyStatusImpl: async () => ({ configured: true }), authorizeImpl: async () => ({ decision: "deny", reason: "explicit-deny" }), invokeImpl: async () => { throw new Error("must not invoke"); } }), /policy denied/);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("copilot CLI plans without invoking a provider", async () => {
  const root = await project();
  try {
    const executable = path.resolve("bin", "forgevena.js");
    const { stdout } = await promisify(execFile)("node", [executable, "copilot", "plan", "Improve", "testing", "--provider", "ollama"], { cwd: root });
    const result = JSON.parse(stdout);
    assert.equal(result.objective, "Improve testing");
    assert.equal(result.readOnly, true);
    assert.equal(result.projectFilesChanged, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

async function project() {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-copilot-"));
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src", "main.js"), "export function start() { return 'private-source-content'; }\n");
  await buildProjectIndex(root, { dryRun: false });
  return root;
}
