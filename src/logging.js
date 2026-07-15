import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const EVENT_FILES = { doctor: "doctor.log", install: "install.log", update: "update.log", rollback: "rollback.log", error: "errors.log", workspace: "workspace.log" };

export async function logEvent(root, type, details, retentionDays = 30) {
  const directory = path.join(root, ".ai-workspace", "logs");
  await mkdir(directory, { recursive: true });
  const file = EVENT_FILES[type] ?? EVENT_FILES.workspace;
  await writeFile(path.join(directory, file), `${JSON.stringify({ at: new Date().toISOString(), type, details })}\n`, { flag: "a" });
  await rotate(directory, retentionDays);
}

async function rotate(directory, retentionDays) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const target = path.join(directory, entry.name);
    const stats = await (await import("node:fs/promises")).stat(target);
    if (stats.mtimeMs < cutoff) await rm(target, { force: true });
  }
}
