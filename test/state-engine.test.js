import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { FileStateEngine, StateError } from "../src/state-engine.js";

async function workspace() { return mkdtemp(path.join(os.tmpdir(), "forgevena-state-")); }

test("state engine writes atomically and validates checksums", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await state.write(".ai-workspace/workspace.json", { schemaVersion: 2, name: "demo" });
    assert.deepEqual(await state.read(".ai-workspace/workspace.json"), { schemaVersion: 2, name: "demo" });
    const checksum = await readFile(path.join(root, ".ai-workspace", "workspace.json.sha256"), "utf8");
    assert.match(checksum, /^[a-f0-9]{64}\n$/);
  } finally { await cleanup(root); }
});

test("state engine rejects corruption instead of silently resetting state", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await state.write(".ai-workspace/workspace.json", { schemaVersion: 2 });
    await writeFile(path.join(root, ".ai-workspace", "workspace.json"), "{}\n");
    await assert.rejects(() => state.read(".ai-workspace/workspace.json"), (error) => error instanceof StateError && error.code === "STATE_CHECKSUM_MISMATCH");
  } finally { await cleanup(root); }
});

test("state engine serializes concurrent updates", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await state.write(".ai-workspace/counter.json", { value: 0 });
    await Promise.all(Array.from({ length: 32 }, () => state.update(".ai-workspace/counter.json", (current) => ({ value: current.value + 1 }))));
    assert.equal((await state.read(".ai-workspace/counter.json")).value, 32);
  } finally { await cleanup(root); }
});

test("state engine transactions commit multiple documents", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const result = await state.transaction([
      { relativePath: ".ai-workspace/one.json", value: { value: 1 } },
      { relativePath: ".ai-workspace/two.json", value: { value: 2 } },
    ]);
    assert.equal(result.committed, true);
    assert.equal((await state.read(".ai-workspace/one.json")).value, 1);
    assert.equal((await state.read(".ai-workspace/two.json")).value, 2);
  } finally { await cleanup(root); }
});

test("state engine enforces workspace-contained paths", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await assert.rejects(() => state.write("outside.json", {}), (error) => error.code === "STATE_PATH_INVALID");
  } finally { await cleanup(root); }
});

test("state engine snapshots existing documents and records history", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await state.write(".ai-workspace/workspace.json", { schemaVersion: 2, modules: [] });
    const snapshot = await state.snapshot([".ai-workspace/workspace.json", ".ai-workspace/missing.json"], { id: "test-snapshot" });
    assert.equal(snapshot.entries.length, 1);
    assert.equal(snapshot.entries[0].relativePath, ".ai-workspace/workspace.json");
    assert.equal(JSON.parse(await readFile(path.join(root, snapshot.entries[0].file), "utf8")).schemaVersion, 2);
    assert.deepEqual(await state.history(), []);
  } finally { await cleanup(root); }
});

test("state engine rolls back a failed multi-document transaction", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await state.write(".ai-workspace/one.json", { value: "original" });
    await assert.rejects(() => state.transaction([
      { relativePath: ".ai-workspace/one.json", value: { value: "changed" } },
      { relativePath: ".ai-workspace/two.json", value: null, validate: () => ["invalid"] },
    ]), /validation failed/i);
    assert.equal((await state.read(".ai-workspace/one.json")).value, "original");
    assert.equal((await state.validate(".ai-workspace/two.json")).valid, false);
    assert.equal((await state.history()).at(-1).status, "rolled-back");
  } finally { await cleanup(root); }
});

test("state engine reports schema validation errors", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await assert.rejects(() => state.write(".ai-workspace/invalid.json", {}, { validate: () => "missing schema" }), (error) => error.code === "STATE_SCHEMA_INVALID" && error.details.issues.includes("missing schema"));
  } finally { await cleanup(root); }
});

async function cleanup(root) { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
