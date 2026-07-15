import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIRECTORY = ".ai-workspace";
const FILE = "config.json";
const DEFAULTS = { output: "json", logRetentionDays: 30, confirmApply: true };

export async function loadConfig(root) {
  try { return { ...DEFAULTS, ...JSON.parse(await readFile(path.join(root, DIRECTORY, FILE), "utf8")) }; }
  catch { return { ...DEFAULTS }; }
}

export async function setConfig(root, key, value, { dryRun = true } = {}) {
  if (!Object.hasOwn(DEFAULTS, key)) throw new Error(`Unsupported configuration key: ${key}`);
  const config = await loadConfig(root);
  const next = { ...config, [key]: parseValue(value) };
  if (dryRun) return { root, dryRun: true, next, confirmation: "Preview only. Re-run with --apply to save configuration." };
  await mkdir(path.join(root, DIRECTORY), { recursive: true });
  await writeFile(path.join(root, DIRECTORY, FILE), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { root, dryRun: false, config: next };
}

function parseValue(value) { if (value === "true") return true; if (value === "false") return false; if (/^\d+$/.test(value)) return Number(value); return value; }
