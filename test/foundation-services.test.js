import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { detectProject } from "../src/doctor.js";
import { logEvent } from "../src/logging.js";
import { moduleContract, supportedModules } from "../src/modules.js";

test("project detector identifies a Next.js project without writing files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-detector-"));
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" } }));
    const result = await detectProject(root);
    assert.deepEqual(result.frameworks, ["Next.js"]);
    assert.equal(result.flags["package.json"], true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("logging writes the command-specific JSONL file", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-log-"));
  try {
    await logEvent(root, "doctor", { ok: true });
    const log = await readFile(path.join(root, ".ai-workspace", "logs", "doctor.log"), "utf8");
    assert.match(log, /"ok":true/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("every supported module exposes the complete lifecycle contract", () => {
  for (const name of supportedModules()) {
    const module = moduleContract(name);
    for (const method of ["initialize", "validate", "install", "update", "status", "remove", "rollback"]) assert.equal(typeof module[method], "function");
  }
});
