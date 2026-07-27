import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { FileStateEngine } from "../src/state-engine.js";

const CASE_COUNT = 1_000;

test("state engine rejects one thousand deterministic journal corruption cases without altering state", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-state-fuzz-"));
  try {
    const state = new FileStateEngine(root);
    const relativePath = ".ai-workspace/workspace.json";
    await state.write(relativePath, { schemaVersion: 2, marker: "preserve-me" });
    const target = path.join(root, relativePath);
    const expected = await readFile(target, "utf8");
    const journalDirectory = path.join(root, ".ai-workspace", "journal");
    const journalPath = path.join(journalDirectory, "fuzz.json");
    await mkdir(journalDirectory, { recursive: true });

    for (let index = 0; index < CASE_COUNT; index += 1) {
      await writeFile(journalPath, corruptionCase(index));
      await assert.rejects(() => state.history(), (error) => error.code === "STATE_JOURNAL_CORRUPT");
      assert.equal(await readFile(target, "utf8"), expected);
    }
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

function corruptionCase(index) {
  const operationId = `fuzz-${index}`;
  const base = { schemaVersion: 1, operationId, status: "prepared", startedAt: "2026-01-01T00:00:00.000Z", changes: [] };
  switch (index % 8) {
    case 0: return `{not-json-${index}}\n`;
    case 1: return `${JSON.stringify({ ...base, schemaVersion: index + 2 })}\n`;
    case 2: return `${JSON.stringify({ ...base, operationId: `../${operationId}` })}\n`;
    case 3: return `${JSON.stringify({ ...base, status: `unknown-${index}` })}\n`;
    case 4: return `${JSON.stringify({ ...base, startedAt: index })}\n`;
    case 5: return `${JSON.stringify({ ...base, changes: null })}\n`;
    case 6: return `${JSON.stringify({ ...base, changes: [{ relativePath: "outside.json", backup: null }] })}\n`;
    default: return `${JSON.stringify({ ...base, changes: [{ relativePath: ".ai-workspace/workspace.json", backup: "../outside.backup" }] })}\n`;
  }
}
