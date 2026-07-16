import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const DIRECTORY = ".ai-workspace";
const FILE = "config.json";
const DEFAULTS = { output: "json", logRetentionDays: 30, confirmApply: true };

export async function loadConfig(root) { return { ...DEFAULTS, ...(await readStateDocument(root, path.join(DIRECTORY, FILE), DEFAULTS)) }; }

export async function setConfig(root, key, value, { dryRun = true } = {}) {
  if (!Object.hasOwn(DEFAULTS, key)) throw new Error(`Unsupported configuration key: ${key}`);
  const config = await loadConfig(root);
  const next = { ...config, [key]: parseValue(value) };
  if (dryRun) return { root, dryRun: true, next, confirmation: "Preview only. Re-run with --apply to save configuration." };
  await writeStateDocument(root, path.join(DIRECTORY, FILE), next);
  return { root, dryRun: false, config: next };
}

function parseValue(value) { if (value === "true") return true; if (value === "false") return false; if (/^\d+$/.test(value)) return Number(value); return value; }
