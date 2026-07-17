import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { planWorkflow, resumeWorkflow, startWorkflow, validateWorkflow, workflowStatus } from "../src/workflow-engine.js";

const workflow = {
  schemaVersion: 1,
  id: "release-review",
  version: "1.0.0",
  nodes: [
    { id: "review", action: "review", maxRetries: 1 },
    { id: "approve", type: "consent", action: "emit", dependsOn: ["review"], input: { approved: true } },
    { id: "report", action: "report", dependsOn: ["approve"] },
  ],
};

test("workflow runs are deterministic, retryable, resumable, and audit safe", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-workflow-"));
  let reviewAttempts = 0;
  const executor = async ({ node, input, dependencies }) => {
    if (node.action === "review" && ++reviewAttempts === 1) { const error = new Error("temporary"); error.code = "TEMPORARY"; throw error; }
    if (node.action === "review") return { result: "safe", token: "must-not-persist" };
    if (node.action === "report") return { dependencies, authorization: "Bearer hidden-value" };
    return input;
  };
  try {
    assert.deepEqual(planWorkflow(workflow).order, ["review", "approve", "report"]);
    const waiting = await startWorkflow(root, workflow, { runId: "run-1", dryRun: false, executor });
    assert.equal(waiting.status, "waiting-consent");
    assert.equal(waiting.nodes.review.attempts, 2);
    assert.equal(waiting.nodes.review.output.token, "[REDACTED]");
    const completed = await resumeWorkflow(root, "run-1", { approved: ["approve"], executor });
    assert.equal(completed.status, "completed");
    assert.match(completed.nodes.report.output.authorization, /REDACTED/);
    assert.equal((await workflowStatus(root, "run-1")).resumable, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("workflow validation rejects cycles and excessive retries", () => {
  assert.throws(() => validateWorkflow({ schemaVersion: 1, id: "cycle", version: "1.0.0", nodes: [{ id: "a", dependsOn: ["b"] }, { id: "b", dependsOn: ["a"] }] }), (error) => error.code === "WORKFLOW_CYCLE");
  assert.throws(() => validateWorkflow({ schemaVersion: 1, id: "retry", version: "1.0.0", nodes: [{ id: "a", maxRetries: 6 }] }), (error) => error.code === "WORKFLOW_RETRIES_INVALID");
});
