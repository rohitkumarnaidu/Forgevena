import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const HISTORY_PATH = path.join(".ai-workspace", "providers", "test-history.json");
const HISTORY_LIMIT = 20;

export async function providerTestHistory(root) {
  const document = await readStateDocument(root, HISTORY_PATH, { schemaVersion: 1, records: [] }, validateHistory);
  return { schemaVersion: 1, records: (document.records ?? []).slice(-HISTORY_LIMIT).map(safeRecord), secretValuesReturned: false };
}

export async function recordProviderTest(root, result) {
  const history = await providerTestHistory(root);
  const record = safeRecord({
    provider: result.provider,
    model: result.model ?? null,
    operationId: result.operationId,
    status: "success",
    testedAt: new Date().toISOString(),
    usage: usageMetadata(result.usage),
    compatibilityEvidenceId: result.compatibilityEvidenceId ?? null,
    warningCodes: (result.warnings ?? []).map((warning) => typeof warning === "string" ? warning : warning?.code).filter(Boolean),
  });
  await writeStateDocument(root, HISTORY_PATH, { schemaVersion: 1, records: [...history.records, record].slice(-HISTORY_LIMIT) }, validateHistory);
  return record;
}

function usageMetadata(usage) {
  if (!usage || typeof usage !== "object") return null;
  return Object.fromEntries(Object.entries(usage).filter(([, value]) => typeof value === "number" && Number.isFinite(value)));
}

function safeRecord(record) {
  return {
    provider: String(record.provider ?? ""), model: record.model ? String(record.model) : null,
    operationId: record.operationId ? String(record.operationId) : null,
    status: record.status === "success" ? "success" : "failed",
    testedAt: String(record.testedAt ?? ""), usage: usageMetadata(record.usage),
    compatibilityEvidenceId: record.compatibilityEvidenceId ? String(record.compatibilityEvidenceId) : null,
    warningCodes: [...new Set((record.warningCodes ?? []).map(String))],
  };
}

function validateHistory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Provider test history must be an object."];
  if (value.schemaVersion !== 1) return ["Provider test history schemaVersion must be 1."];
  if (!Array.isArray(value.records) || value.records.length > HISTORY_LIMIT) return [`Provider test history records must contain at most ${HISTORY_LIMIT} entries.`];
  return value.records.every((record) => record && typeof record === "object" && typeof record.provider === "string" && typeof record.status === "string" && typeof record.testedAt === "string")
    ? true
    : ["Provider test history records are invalid."];
}
