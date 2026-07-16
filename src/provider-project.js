import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { providerDefinition } from "./provider-runtime.js";

const CONFIG_PATH = path.join(".ai-workspace", "providers", "project.json");
const DEFAULTS = { defaultProvider: "openai", fallbackProvider: null, embeddingProvider: null, model: null, embeddingModel: null, temperature: 0.2, maxOutputTokens: 4096, retries: 2, timeoutMs: 60000, priority: [] };

export async function readProjectProviderConfig(root) {
  try { return { ...DEFAULTS, ...JSON.parse(await readFile(path.join(root, CONFIG_PATH), "utf8")) }; }
  catch { return { ...DEFAULTS }; }
}

export async function configureProjectProviders(root, updates, { dryRun = true } = {}) {
  const current = await readProjectProviderConfig(root);
  const next = { ...current, ...clean(updates) };
  for (const name of [next.defaultProvider, next.fallbackProvider, next.embeddingProvider, ...next.priority].filter(Boolean)) providerDefinition(name);
  if (!(Number(next.temperature) >= 0 && Number(next.temperature) <= 2)) throw new Error("Temperature must be between 0 and 2.");
  if (!(Number(next.maxOutputTokens) > 0) || !(Number(next.retries) >= 0) || !(Number(next.timeoutMs) > 0)) throw new Error("Token, retry, and timeout values must be valid positive limits.");
  const plan = { dryRun, path: CONFIG_PATH, previous: current, next, storesSecrets: false };
  if (dryRun) return plan;
  const target = path.join(root, CONFIG_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { ...plan, dryRun: false, configured: true };
}
function clean(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined)); }
