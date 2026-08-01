import { access } from "node:fs/promises";
import path from "node:path";
import { readStateDocument, updateStateDocument, writeStateDocument } from "./state-documents.js";

const DEFAULT_POLICY = Object.freeze({
  mode: "guarded",
  maxInputCharacters: 20000,
  maxOutputTokens: 2048,
  timeoutMs: 60000,
  retries: 2,
  monthlyRequestLimit: 100,
  requireCurrentCompatibility: false,
  maxAttempts: 3,
  maxTotalTokens: null,
  maxEstimatedCost: null,
});

export async function readProviderPolicy(root, provider) {
  const document = await readPolicyDocument(root);
  const configured = document.providers?.[provider] ?? {};
  return { ...DEFAULT_POLICY, ...configured, usage: currentUsage(document.usage?.[provider]) };
}

export async function setProviderPolicy(root, provider, updates, { dryRun = true } = {}) {
  const policy = validatePolicy({ ...(await readProviderPolicy(root, provider)), ...updates });
  const relative = path.join(".ai-workspace", "providers", "policies.json");
  if (dryRun) return { provider, dryRun: true, path: relative, policy };
  const document = await readPolicyDocument(root);
  document.providers = { ...(document.providers ?? {}), [provider]: stripUsage(policy) };
  document.updatedAt = new Date().toISOString();
  await writeStateDocument(root, relative, document);
  return { provider, dryRun: false, path: relative, policy };
}

export async function recordProviderUsage(root, provider, usage) {
  await updateStateDocument(root, path.join(".ai-workspace", "providers", "policies.json"), (document) => {
    const current = currentUsage(document.usage?.[provider]);
    return { ...document, usage: { ...(document.usage ?? {}), [provider]: {
      month: current.month,
      requests: current.requests + 1,
      inputCharacters: current.inputCharacters + Number(usage.inputCharacters ?? 0),
      outputCharacters: current.outputCharacters + Number(usage.outputCharacters ?? 0),
      lastUsedAt: new Date().toISOString(),
    } }, updatedAt: new Date().toISOString() };
  }, { schemaVersion: 1, providers: {}, usage: {} });
}

function validatePolicy(policy) {
  if (!["guarded", "budgeted", "unrestricted"].includes(policy.mode)) throw new Error("Policy mode must be guarded, budgeted, or unrestricted.");
  for (const field of ["maxInputCharacters", "maxOutputTokens", "timeoutMs", "monthlyRequestLimit", "maxAttempts"]) {
    if (!Number.isInteger(Number(policy[field])) || Number(policy[field]) <= 0) throw new Error(`${field} must be a positive integer.`);
    policy[field] = Number(policy[field]);
  }
  if (!Number.isInteger(Number(policy.retries)) || Number(policy.retries) < 0 || Number(policy.retries) > 2) throw new Error("retries must be an integer between 0 and 2.");
  policy.retries = Number(policy.retries);
  if (policy.maxAttempts > 3) throw new Error("maxAttempts cannot exceed 3.");
  policy.requireCurrentCompatibility = policy.requireCurrentCompatibility === true || policy.requireCurrentCompatibility === "true";
  for (const field of ["maxTotalTokens", "maxEstimatedCost"]) if (policy[field] !== null && policy[field] !== undefined) { const number = Number(policy[field]); if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be null or a non-negative number.`); policy[field] = number; }
  return policy;
}

function stripUsage(policy) { const { usage, ...stored } = policy; return stored; }
function monthKey() { return new Date().toISOString().slice(0, 7); }
function currentUsage(value = {}) { return value.month === monthKey() ? { month: value.month, requests: Number(value.requests ?? 0), inputCharacters: Number(value.inputCharacters ?? 0), outputCharacters: Number(value.outputCharacters ?? 0), lastUsedAt: value.lastUsedAt ?? null } : { month: monthKey(), requests: 0, inputCharacters: 0, outputCharacters: 0, lastUsedAt: null }; }
async function readPolicyDocument(root) { return readStateDocument(root, path.join(".ai-workspace", "providers", "policies.json"), { schemaVersion: 1, providers: {}, usage: {} }); }
export async function providerPolicyExists(root) { try { await access(path.join(root, ".ai-workspace", "providers", "policies.json")); return true; } catch { return false; } }
