import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { redact } from "./logging.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const RUN_ROOT = path.join(".ai-workspace", "workflows", "runs");

export class WorkflowError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "WorkflowError"; this.code = code; this.details = details; }
}

export async function loadWorkflow(source) { return validateWorkflow(JSON.parse(await readFile(path.resolve(source), "utf8"))); }

export function validateWorkflow(value) {
  if (value?.schemaVersion !== 1) throw new WorkflowError("WORKFLOW_SCHEMA_INVALID", "Workflow schemaVersion must be 1.");
  if (!safeId(value.id)) throw new WorkflowError("WORKFLOW_ID_INVALID", "Workflow id must use safe characters.");
  if (!/^\d+\.\d+\.\d+$/.test(value.version ?? "")) throw new WorkflowError("WORKFLOW_VERSION_INVALID", "Workflow version must use semantic versioning.");
  if (!Array.isArray(value.nodes) || value.nodes.length === 0) throw new WorkflowError("WORKFLOW_NODES_INVALID", "Workflow requires at least one node.");
  const nodes = value.nodes.map((node) => ({ id: requiredId(node.id), type: node.type === "consent" ? "consent" : "task", action: String(node.action ?? "noop"), dependsOn: [...new Set((node.dependsOn ?? []).map(String))].sort(), maxRetries: boundedRetries(node.maxRetries), input: redact(node.input ?? {}), mutating: node.mutating === true }));
  const ids = new Set(nodes.map(({ id }) => id));
  if (ids.size !== nodes.length) throw new WorkflowError("WORKFLOW_NODE_DUPLICATE", "Workflow node ids must be unique.");
  for (const node of nodes) for (const dependency of node.dependsOn) if (!ids.has(dependency)) throw new WorkflowError("WORKFLOW_DEPENDENCY_UNKNOWN", `Node ${node.id} depends on unknown node ${dependency}.`);
  return { schemaVersion: 1, id: value.id, version: value.version, description: String(value.description ?? ""), nodes, order: topologicalOrder(nodes) };
}

export function planWorkflow(workflow) { const validated = validateWorkflow(workflow); return { workflow: validated.id, version: validated.version, order: validated.order, nodes: validated.order.map((id) => { const node = validated.nodes.find((entry) => entry.id === id); return { id, type: node.type, action: node.action, dependencies: node.dependsOn, maxAttempts: node.maxRetries + 1, consentRequired: node.type === "consent" || node.mutating }; }), deterministic: true, resumable: true }; }

export async function startWorkflow(root, workflow, { runId = randomUUID(), dryRun = true, approved = [], executor = defaultExecutor } = {}) {
  const validated = validateWorkflow(workflow);
  if (!safeId(runId)) throw new WorkflowError("WORKFLOW_RUN_ID_INVALID", "Run id must use safe characters.");
  const relative = runPath(runId);
  const existing = await readStateDocument(root, relative, null, (value) => value === null || validateRun(value));
  if (existing) throw new WorkflowError("WORKFLOW_RUN_EXISTS", `Workflow run ${runId} already exists.`);
  const run = { schemaVersion: 1, runId, workflow: { id: validated.id, version: validated.version, description: validated.description, nodes: validated.nodes, order: validated.order }, status: "pending", cursor: 0, nodes: Object.fromEntries(validated.nodes.map((node) => [node.id, { status: "pending", attempts: 0, output: null, outputHash: null, errorCode: null }])), approved: [...new Set(approved)], audit: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (dryRun) return { dryRun: true, runId, path: relative, plan: planWorkflow(validated), create: [relative] };
  await writeRun(root, run);
  return executeRun(root, run, { executor });
}

export async function resumeWorkflow(root, runId, { approved = [], executor = defaultExecutor } = {}) {
  const run = await readRun(root, runId);
  if (["completed", "failed"].includes(run.status)) return summarizeRun(run);
  run.approved = [...new Set([...run.approved, ...approved])];
  return executeRun(root, run, { executor });
}

export async function workflowStatus(root, runId) { return summarizeRun(await readRun(root, runId)); }

async function executeRun(root, run, { executor }) {
  run.status = "running";
  await writeRun(root, run);
  while (run.cursor < run.workflow.order.length) {
    const nodeId = run.workflow.order[run.cursor];
    const node = run.workflow.nodes.find((entry) => entry.id === nodeId);
    const state = run.nodes[nodeId];
    if (state.status === "completed") { run.cursor += 1; continue; }
    if (node.type === "consent" || node.mutating) {
      if (!run.approved.includes(node.id)) { state.status = "waiting-consent"; run.status = "waiting-consent"; run.audit.push(event(node.id, "consent.required")); await writeRun(root, run); return summarizeRun(run); }
      run.audit.push(event(node.id, "consent.approved"));
    }
    const dependencyOutputs = Object.fromEntries(node.dependsOn.map((id) => [id, run.nodes[id].output]));
    let completed = false;
    while (state.attempts <= node.maxRetries && !completed) {
      state.attempts += 1; state.status = "running"; run.audit.push(event(node.id, "node.started", { attempt: state.attempts })); await writeRun(root, run);
      try {
        const raw = await executor({ runId: run.runId, workflow: run.workflow.id, node, input: node.input, dependencies: dependencyOutputs, attempt: state.attempts });
        const output = redact(raw ?? null);
        state.status = "completed"; state.output = output; state.outputHash = hash(output); state.errorCode = null; completed = true;
        run.audit.push(event(node.id, "node.completed", { attempt: state.attempts, outputHash: state.outputHash }));
      } catch (error) {
        state.errorCode = error.code ?? "WORKFLOW_NODE_FAILED"; run.audit.push(event(node.id, "node.failed", { attempt: state.attempts, errorCode: state.errorCode }));
        if (state.attempts > node.maxRetries || error.retryable === false) { state.status = "failed"; run.status = "failed"; await writeRun(root, run); return summarizeRun(run); }
      }
    }
    run.cursor += 1;
    await writeRun(root, run);
  }
  run.status = "completed"; run.completedAt = new Date().toISOString(); await writeRun(root, run); return summarizeRun(run);
}

function topologicalOrder(nodes) { const remaining = new Map(nodes.map((node) => [node.id, new Set(node.dependsOn)])); const order = []; while (remaining.size) { const ready = [...remaining.entries()].filter(([, dependencies]) => dependencies.size === 0).map(([id]) => id).sort(); if (!ready.length) throw new WorkflowError("WORKFLOW_CYCLE", "Workflow dependency graph contains a cycle."); for (const id of ready) { order.push(id); remaining.delete(id); for (const dependencies of remaining.values()) dependencies.delete(id); } } return order; }
async function readRun(root, runId) { const run = await readStateDocument(root, runPath(runId), null, (value) => value === null || validateRun(value)); if (!run) throw new WorkflowError("WORKFLOW_RUN_NOT_FOUND", `Workflow run ${runId} was not found.`); return run; }
async function writeRun(root, run) { run.updatedAt = new Date().toISOString(); run.audit = run.audit.slice(-1000); await writeStateDocument(root, runPath(run.runId), run, validateRun); }
function summarizeRun(run) { return { runId: run.runId, workflow: run.workflow.id, version: run.workflow.version, status: run.status, cursor: run.cursor, totalNodes: run.workflow.order.length, nodes: run.nodes, waitingFor: Object.entries(run.nodes).filter(([, value]) => value.status === "waiting-consent").map(([id]) => id), auditEntries: run.audit.length, resumable: !["completed", "failed"].includes(run.status) }; }
function runPath(runId) { return path.join(RUN_ROOT, `${requiredId(runId)}.json`); }
function validateRun(value) { return value?.schemaVersion === 1 && value.runId && value.workflow && value.nodes && Array.isArray(value.audit) ? true : ["Workflow run state is invalid."]; }
function event(node, action, details = {}) { return { at: new Date().toISOString(), node, action, details: redact(details) }; }
function hash(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function boundedRetries(value = 0) { const retries = Number(value); if (!Number.isInteger(retries) || retries < 0 || retries > 5) throw new WorkflowError("WORKFLOW_RETRIES_INVALID", "Workflow retries must be between 0 and 5."); return retries; }
function requiredId(value) { if (!safeId(value)) throw new WorkflowError("WORKFLOW_NODE_ID_INVALID", "Workflow node ids must use safe characters."); return value; }
function safeId(value) { return /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value ?? ""); }
async function defaultExecutor({ node, input }) { if (node.action === "noop") return { completed: true }; if (node.action === "emit") return input; throw new WorkflowError("WORKFLOW_ACTION_UNSUPPORTED", `Unsupported built-in workflow action: ${node.action}.`); }
