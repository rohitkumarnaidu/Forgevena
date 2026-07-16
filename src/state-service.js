import path from "node:path";
import { FileStateEngine } from "./state-engine.js";
import { REGISTRY_SCHEMA_VERSION } from "./version.js";

const DOCUMENTS = [".ai-workspace/workspace.json", ".ai-workspace/managed-assets.json", ".ai-workspace/providers/registry.json", ".ai-workspace/plugins/registry.json", ".ai-workspace/mcp/registry.json"];
export async function stateStatus(root) { const engine = new FileStateEngine(root); const documents = await Promise.all(DOCUMENTS.map((document) => engine.validate(document))); return { schemaVersion: REGISTRY_SCHEMA_VERSION, documents, healthy: documents.filter((entry) => entry.error?.code !== "ENOENT").every((entry) => entry.valid) }; }
export async function snapshotState(root, { dryRun = true } = {}) { if (dryRun) return { dryRun: true, documents: DOCUMENTS, affectedPaths: [path.join(".ai-workspace", "snapshots")], message: "Re-run with --apply to create a local state snapshot." }; return { dryRun: false, snapshot: await new FileStateEngine(root).snapshot(DOCUMENTS) }; }
export async function repairState(root, { dryRun = true } = {}) { const engine = new FileStateEngine(root); const pending = (await engine.history()).filter((entry) => entry.status === "prepared").map((entry) => entry.operationId); if (dryRun) return { dryRun: true, pending, message: pending.length ? "Re-run with --apply to restore prepared transactions." : "No interrupted transactions require recovery." }; return { dryRun: false, ...(await engine.recover()) }; }
export async function stateHistory(root) { return { operations: await new FileStateEngine(root).history() }; }
export async function migrateState(root, options = {}) { const status = await stateStatus(root); return { ...status, dryRun: options.dryRun ?? true, migrated: false, message: "Legacy documents are migrated opportunistically on their next managed write; current paths remain compatible." }; }
