import { randomUUID } from "node:crypto";
export function renderResult(value, options = {}, { operationId = randomUUID() } = {}) {
  if (!options.structured && !options.verbose) return JSON.stringify(value, null, 2);
  return JSON.stringify({ schemaVersion: 1, operationId, status: "success", warnings: value?.warnings ?? [], changes: value?.changes ?? value?.create ?? value?.created ?? [], result: value, diagnostics: options.verbose ? { dryRun: options.dryRun, nonInteractive: options.nonInteractive, mergePolicy: options.mergePolicy } : undefined }, null, 2);
}
export function renderError(error, { operationId = randomUUID() } = {}) { return JSON.stringify({ schemaVersion: 1, operationId, status: "error", error: { code: error.code ?? "UNEXPECTED_ERROR", message: error.message, details: error.details ?? {} } }, null, 2); }
