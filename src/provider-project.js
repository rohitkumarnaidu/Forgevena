import path from "node:path";
import { providerDefinition } from "./provider-runtime.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const CONFIG_PATH = path.join(".ai-workspace", "providers", "project.json");
const DEFAULTS = { defaultProvider: "openai", fallbackProvider: null, embeddingProvider: null, model: null, embeddingModel: null, temperature: 0.2, maxOutputTokens: 4096, retries: 2, timeoutMs: 60000, priority: [], requireCurrentCompatibility: false, dataRegion: null, maxAttempts: 3, maxTotalTokens: null, maxEstimatedCost: null };

export async function readProjectProviderConfig(root) { return { ...DEFAULTS, ...(await readStateDocument(root, CONFIG_PATH, DEFAULTS)) }; }

export async function configureProjectProviders(root, updates, { dryRun = true } = {}) {
  const current = await readProjectProviderConfig(root);
  const next = { ...current, ...clean(updates) };
  for (const name of [next.defaultProvider, next.fallbackProvider, next.embeddingProvider, ...next.priority].filter(Boolean)) providerDefinition(name);
  const temperature = Number(next.temperature);
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw new Error("Temperature must be between 0 and 2.");
  next.temperature = temperature;
  for (const field of ["maxOutputTokens", "timeoutMs", "maxAttempts"]) {
    const value = Number(next[field]);
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0 || (field === "maxAttempts" && value > 3)) throw new Error("Token, retry, timeout, and attempt values must be positive limits within governed maximums.");
    next[field] = value;
  }
  const retries = Number(next.retries);
  if (!Number.isFinite(retries) || !Number.isInteger(retries) || retries < 0 || retries > 3) throw new Error("Token, retry, timeout, and attempt values must be positive limits within governed maximums.");
  next.retries = retries;
  if (next.maxTotalTokens !== null) {
    const value = Number(next.maxTotalTokens);
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) throw new Error("maxTotalTokens must be null or a positive integer.");
    next.maxTotalTokens = value;
  }
  if (next.maxEstimatedCost !== null) {
    const value = Number(next.maxEstimatedCost);
    if (!Number.isFinite(value) || value < 0) throw new Error("maxEstimatedCost must be null or a non-negative number.");
    next.maxEstimatedCost = value;
  }
  next.requireCurrentCompatibility = next.requireCurrentCompatibility === true || next.requireCurrentCompatibility === "true";
  const plan = { dryRun, path: CONFIG_PATH, previous: current, next, storesSecrets: false };
  if (dryRun) return plan;
  await writeStateDocument(root, CONFIG_PATH, next);
  return { ...plan, dryRun: false, configured: true };
}
function clean(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined)); }
