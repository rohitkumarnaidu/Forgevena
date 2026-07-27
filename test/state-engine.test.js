import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { FileStateEngine, StateError } from "../src/state-engine.js";
import { migrateState, repairState, snapshotState, stateHistory, stateStatus } from "../src/state-service.js";

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

test("state engine rejects malformed transaction journals", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "broken.json"), "{not-json}\n");
    await assert.rejects(() => state.history(), (error) => error.code === "STATE_JOURNAL_CORRUPT");
  } finally { await cleanup(root); }
});

test("state status reports corrupt journals without declaring the workspace healthy", async () => {
  const root = await workspace();
  try {
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "broken.json"), "{not-json}\n");
    const status = await stateStatus(root);
    assert.equal(status.healthy, false);
    assert.equal(status.journals.valid, false);
    assert.equal(status.journals.error.code, "STATE_JOURNAL_CORRUPT");
  } finally { await cleanup(root); }
});

test("state engine recovery fails closed when a prepared journal backup is missing", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const relativePath = ".ai-workspace/workspace.json";
    const operationId = "interrupted-operation";
    await state.write(relativePath, { state: "unchanged" });
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${operationId}.json`), `${JSON.stringify({ schemaVersion: 1, operationId, status: "prepared", startedAt: new Date().toISOString(), changes: [{ relativePath, backup: path.join(".ai-workspace", `workspace.json.${operationId}.backup`) }] }, null, 2)}\n`);
    await assert.rejects(() => state.recover(), (error) => error.code === "STATE_JOURNAL_BACKUP_MISSING");
    assert.deepEqual(await state.read(relativePath), { state: "unchanged" });
  } finally { await cleanup(root); }
});

test("state engine rejects journals with unexpected backup paths", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "unsafe.json"), `${JSON.stringify({ schemaVersion: 1, operationId: "unsafe-operation", status: "prepared", startedAt: new Date().toISOString(), changes: [{ relativePath: ".ai-workspace/workspace.json", backup: "..\\outside.backup" }] }, null, 2)}\n`);
    await assert.rejects(() => state.history(), (error) => error.code === "STATE_JOURNAL_CORRUPT");
  } finally { await cleanup(root); }
});

test("state engine rejects unsafe operation and snapshot identifiers", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    await assert.rejects(() => state.write(".ai-workspace/workspace.json", {}, { operationId: "../outside" }), (error) => error.code === "STATE_OPERATION_ID_INVALID");
    await assert.rejects(() => state.transaction([], { operationId: "unsafe/path" }), (error) => error.code === "STATE_OPERATION_ID_INVALID");
    await assert.rejects(() => state.snapshot([], { id: "../outside" }), (error) => error.code === "STATE_SNAPSHOT_ID_INVALID");
  } finally { await cleanup(root); }
});

test("state engine retains only the configured number of completed journals", async () => {
  const root = await workspace();
  try {
    let now = Date.parse("2026-01-01T00:00:00.000Z");
    const state = new FileStateEngine(root, { journalRetention: 2, clock: () => now++ });
    for (let index = 0; index < 4; index += 1) {
      await state.transaction([{ relativePath: ".ai-workspace/workspace.json", value: { index } }], { operationId: `operation-${index}` });
    }
    const history = await state.history();
    assert.deepEqual(history.map(({ operationId }) => operationId).sort(), ["operation-2", "operation-3"]);
  } finally { await cleanup(root); }
});

test("state engine never prunes prepared journals", async () => {
  const root = await workspace();
  try {
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "pending.json"), `${JSON.stringify({ schemaVersion: 1, operationId: "pending", status: "prepared", startedAt: new Date().toISOString(), changes: [] }, null, 2)}\n`);
    const state = new FileStateEngine(root, { journalRetention: 0 });
    await state.transaction([], { operationId: "completed" });
    assert.deepEqual((await state.history()).map(({ operationId }) => operationId), ["pending"]);
  } finally { await cleanup(root); }
});

test("state engine recovers a prepared transaction from its verified backup", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const relativePath = ".ai-workspace/workspace.json";
    const operationId = "recoverable-operation";
    await state.write(relativePath, { state: "original" });
    const target = path.join(root, relativePath);
    const backup = `${target}.${operationId}.backup`;
    await writeFile(backup, await readFile(target, "utf8"));
    await state.write(relativePath, { state: "interrupted" });
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${operationId}.json`), `${JSON.stringify({ schemaVersion: 1, operationId, status: "prepared", startedAt: new Date().toISOString(), changes: [{ relativePath, backup: path.relative(root, backup) }] }, null, 2)}\n`);
    assert.deepEqual(await state.recover(), { recovered: [operationId] });
    assert.deepEqual(await state.read(relativePath), { state: "original" });
    assert.equal((await state.history())[0].status, "rolled-back");
  } finally { await cleanup(root); }
});

test("state engine reads checksumless legacy state and validates readable documents", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const target = path.join(root, ".ai-workspace", "legacy.json");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "{\"schemaVersion\":1}\n");
    assert.deepEqual(await state.read(".ai-workspace/legacy.json"), { schemaVersion: 1 });
    assert.equal((await state.validate(".ai-workspace/legacy.json", (value) => value.schemaVersion === 1)).valid, true);
  } finally { await cleanup(root); }
});

test("state engine reports lock contention and recovers stale locks", async () => {
  const root = await workspace();
  try {
    const relativePath = ".ai-workspace/workspace.json";
    const state = new FileStateEngine(root);
    let releaseWork;
    let markAcquired;
    const acquired = new Promise((resolve) => { markAcquired = resolve; });
    const blocked = new Promise((resolve) => { releaseWork = resolve; });
    const holder = state.withLock(relativePath, async () => { markAcquired(); await blocked; });
    await acquired;
    const contender = new FileStateEngine(root, { lockTimeoutMs: 0 });
    await assert.rejects(() => contender.write(relativePath, {}), (error) => error.code === "STATE_LOCK_TIMEOUT");
    releaseWork();
    await holder;

    const lockName = createHash("sha256").update(relativePath).digest("hex");
    const lockPath = path.join(root, ".ai-workspace", "locks", `${lockName}.lock`);
    await writeFile(lockPath, "{}\n");
    const staleAware = new FileStateEngine(root, { staleLockMs: -1 });
    await staleAware.write(relativePath, { recovered: true });
    assert.deepEqual(await staleAware.read(relativePath), { recovered: true });
  } finally { await cleanup(root); }
});

test("state engine removes owned temporary files after an atomic rename failure", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const target = path.join(root, ".ai-workspace", "workspace.json");
    await mkdir(target, { recursive: true });
    await assert.rejects(() => state.write(".ai-workspace/workspace.json", {}, { operationId: "rename-failure" }));
    await assert.rejects(() => access(`${target}.rename-failure.tmp`));
  } finally { await cleanup(root); }
});

test("state engine surfaces disk-full failures and removes owned temporary files", async () => {
  const root = await workspace();
  try {
    const failure = Object.assign(new Error("No space left on device"), { code: "ENOSPC" });
    const state = new FileStateEngine(root, { faultInjector: async (stage) => { if (stage === "before-write") throw failure; } });
    const target = path.join(root, ".ai-workspace", "workspace.json");
    await assert.rejects(() => state.write(".ai-workspace/workspace.json", {}, { operationId: "disk-full" }), (error) => error.code === "ENOSPC");
    await assert.rejects(() => access(target));
    await assert.rejects(() => access(`${target}.disk-full.tmp`));
  } finally { await cleanup(root); }
});

test("state engine surfaces permission failures without replacing committed state", async () => {
  const root = await workspace();
  try {
    const relativePath = ".ai-workspace/workspace.json";
    const baseline = new FileStateEngine(root);
    await baseline.write(relativePath, { value: "original" });
    const failure = Object.assign(new Error("Access denied"), { code: "EACCES" });
    const state = new FileStateEngine(root, { faultInjector: async (stage) => { if (stage === "before-rename") throw failure; } });
    const target = path.join(root, relativePath);
    await assert.rejects(() => state.write(relativePath, { value: "changed" }, { operationId: "permission-denied" }), (error) => error.code === "EACCES");
    assert.deepEqual(await baseline.read(relativePath), { value: "original" });
    await assert.rejects(() => access(`${target}.permission-denied.tmp`));
  } finally { await cleanup(root); }
});

test("state engine rejects invalid journal structures and unsafe journal paths", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root);
    const directory = path.join(root, ".ai-workspace", "journal");
    await mkdir(directory, { recursive: true });
    const invalid = [
      ["structure.json", { schemaVersion: 99, operationId: "structure", status: "prepared", startedAt: new Date().toISOString(), changes: [] }],
      ["change.json", { schemaVersion: 1, operationId: "change", status: "prepared", startedAt: new Date().toISOString(), changes: [null] }],
      ["path.json", { schemaVersion: 1, operationId: "path", status: "prepared", startedAt: new Date().toISOString(), changes: [{ relativePath: "outside.json", backup: null }] }],
    ];
    for (const [file, journal] of invalid) {
      await writeFile(path.join(directory, file), `${JSON.stringify(journal)}\n`);
      await assert.rejects(() => state.history(), (error) => error.code === "STATE_JOURNAL_CORRUPT");
      await rm(path.join(directory, file));
    }
  } finally { await cleanup(root); }
});

test("state engine rejects invalid retention configuration", async () => {
  const root = await workspace();
  try {
    const state = new FileStateEngine(root, { journalRetention: -1 });
    await assert.rejects(() => state.transaction([], { operationId: "invalid-retention" }), (error) => error.code === "STATE_JOURNAL_RETENTION_INVALID");
  } finally { await cleanup(root); }
});

test("state service previews and applies snapshots, repairs, history, and migration status", async () => {
  const root = await workspace();
  try {
    assert.equal((await stateStatus(root)).healthy, true);
    assert.equal((await snapshotState(root)).dryRun, true);
    assert.equal((await snapshotState(root, { dryRun: false })).snapshot.schemaVersion, 1);
    assert.deepEqual(await stateHistory(root), { operations: [] });
    assert.equal((await repairState(root)).dryRun, true);
    assert.deepEqual(await repairState(root, { dryRun: false }), { dryRun: false, recovered: [] });
    const migration = await migrateState(root, { dryRun: true });
    assert.equal(migration.migrated, false);
    assert.equal(migration.healthy, true);
  } finally { await cleanup(root); }
});

async function cleanup(root) { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
