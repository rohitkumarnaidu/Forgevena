import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const EVENT_FILES = { doctor: "doctor.log", install: "install.log", update: "update.log", rollback: "rollback.log", error: "errors.log", workspace: "workspace.log" };
const SENSITIVE_KEY = /(?:secret|token|password|authorization|api[-_]?key|credential|private[-_]?key)/i;

export async function logEvent(root, type, details, retentionDays = 30) {
  const directory = path.join(root, ".ai-workspace", "logs");
  await mkdir(directory, { recursive: true });
  const file = EVENT_FILES[type] ?? EVENT_FILES.workspace;
  await writeFile(path.join(directory, file), `${JSON.stringify({ at: new Date().toISOString(), type, details: redact(details) })}\n`, { flag: "a" });
  await rotate(directory, retentionDays);
}

export function redact(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return typeof value === "boolean" ? value : "[REDACTED]";
  if (Array.isArray(value)) return value.map((entry) => redact(entry));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)]));
  if (typeof value === "string") return value.replace(/\bBearer\s+[^\s]+/gi, "Bearer [REDACTED]").replace(/\b(?:sk|key)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]").replace(/((?:api[-_ ]?key|token|password|secret)\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]");
  return value;
}

async function rotate(directory, retentionDays) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const target = path.join(directory, entry.name);
    const stats = await stat(target);
    if (stats.mtimeMs < cutoff) await rm(target, { force: true });
  }
}
