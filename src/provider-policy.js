import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_POLICY = Object.freeze({
  mode: "guarded",
  maxInputCharacters: 20000,
  maxOutputTokens: 2048,
  timeoutMs: 60000,
  retries: 2,
  monthlyRequestLimit: 100,
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
  const target = path.join(root, relative);
  const document = await readPolicyDocument(root);
  document.providers = { ...(document.providers ?? {}), [provider]: stripUsage(policy) };
  document.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  return { provider, dryRun: false, path: relative, policy };
}

export async function recordProviderUsage(root, provider, usage) {
  const target = path.join(root, ".ai-workspace", "providers", "policies.json");
  const document = await readPolicyDocument(root);
  const current = currentUsage(document.usage?.[provider]);
  document.usage = {
    ...(document.usage ?? {}),
    [provider]: {
      month: current.month,
      requests: current.requests + 1,
      inputCharacters: current.inputCharacters + Number(usage.inputCharacters ?? 0),
      outputCharacters: current.outputCharacters + Number(usage.outputCharacters ?? 0),
      lastUsedAt: new Date().toISOString(),
    },
  };
  document.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

function validatePolicy(policy) {
  if (!["guarded", "budgeted", "unrestricted"].includes(policy.mode)) throw new Error("Policy mode must be guarded, budgeted, or unrestricted.");
  for (const field of ["maxInputCharacters", "maxOutputTokens", "timeoutMs", "monthlyRequestLimit"]) {
    if (!Number.isInteger(Number(policy[field])) || Number(policy[field]) <= 0) throw new Error(`${field} must be a positive integer.`);
    policy[field] = Number(policy[field]);
  }
  if (!Number.isInteger(Number(policy.retries)) || Number(policy.retries) < 0 || Number(policy.retries) > 5) throw new Error("retries must be an integer between 0 and 5.");
  policy.retries = Number(policy.retries);
  return policy;
}

function stripUsage(policy) { const { usage, ...stored } = policy; return stored; }
function monthKey() { return new Date().toISOString().slice(0, 7); }
function currentUsage(value = {}) { return value.month === monthKey() ? { month: value.month, requests: Number(value.requests ?? 0), inputCharacters: Number(value.inputCharacters ?? 0), outputCharacters: Number(value.outputCharacters ?? 0), lastUsedAt: value.lastUsedAt ?? null } : { month: monthKey(), requests: 0, inputCharacters: 0, outputCharacters: 0, lastUsedAt: null }; }
async function readPolicyDocument(root) { try { return JSON.parse(await readFile(path.join(root, ".ai-workspace", "providers", "policies.json"), "utf8")); } catch { return { schemaVersion: 1, providers: {}, usage: {} }; } }
export async function providerPolicyExists(root) { try { await access(path.join(root, ".ai-workspace", "providers", "policies.json")); return true; } catch { return false; } }
