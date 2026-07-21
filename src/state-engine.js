import { createHash, randomUUID } from "node:crypto";
import { access, copyFile, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const STATE_ROOT = ".ai-workspace";
const LOCK_ROOT = path.join(STATE_ROOT, "locks");
const JOURNAL_ROOT = path.join(STATE_ROOT, "journal");
const SNAPSHOT_ROOT = path.join(STATE_ROOT, "snapshots");
const DEFAULT_LOCK_TIMEOUT_MS = 30_000;
const DEFAULT_STALE_LOCK_MS = 30_000;
const JOURNAL_SCHEMA_VERSION = 1;
const JOURNAL_STATUSES = new Set(["prepared", "committed", "rolled-back"]);

export class StateError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "StateError";
    this.code = code;
    this.details = details;
  }
}

export class FileStateEngine {
  constructor(root, { lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS, staleLockMs = DEFAULT_STALE_LOCK_MS, clock = () => Date.now() } = {}) {
    this.root = root;
    this.lockTimeoutMs = lockTimeoutMs;
    this.staleLockMs = staleLockMs;
    this.clock = clock;
  }

  async read(relativePath, { fallback, validate } = {}) {
    const target = this.#target(relativePath);
    try {
      const serialized = await readFile(target, "utf8");
      await this.#verifyChecksum(relativePath, serialized);
      const value = JSON.parse(serialized);
      this.#validate(value, validate, relativePath);
      return value;
    } catch (error) {
      if (error?.code === "ENOENT" && fallback !== undefined) return structuredClone(fallback);
      if (error instanceof StateError) throw error;
      if (error instanceof SyntaxError) throw new StateError("STATE_CORRUPT", `State document ${relativePath} is not valid JSON.`, { relativePath, cause: error.message });
      throw error;
    }
  }

  async write(relativePath, value, { validate, operationId = randomUUID() } = {}) {
    this.#validate(value, validate, relativePath);
    return this.withLock(relativePath, async () => this.#writeUnlocked(relativePath, value, operationId));
  }

  async update(relativePath, updater, { fallback = {}, validate, operationId = randomUUID() } = {}) {
    return this.withLock(relativePath, async () => {
      const current = await this.read(relativePath, { fallback, validate });
      const next = await updater(structuredClone(current));
      this.#validate(next, validate, relativePath);
      await this.#writeUnlocked(relativePath, next, operationId);
      return next;
    });
  }

  async transaction(changes, { operationId = randomUUID() } = {}) {
    const ordered = [...changes].sort((left, right) => left.relativePath.localeCompare(right.relativePath));
    const releases = [];
    const journal = { schemaVersion: JOURNAL_SCHEMA_VERSION, operationId, status: "prepared", startedAt: new Date(this.clock()).toISOString(), changes: [] };
    try {
      for (const change of ordered) releases.push(await this.#acquireLock(change.relativePath));
      for (const change of ordered) {
        const target = this.#target(change.relativePath);
        const backup = `${target}.${operationId}.backup`;
        const existed = await exists(target);
        if (existed) await copyFile(target, backup);
        journal.changes.push({ relativePath: change.relativePath, backup: existed ? path.relative(this.root, backup) : null });
      }
      await this.#writeJournal(journal);
      for (const change of ordered) {
        this.#validate(change.value, change.validate, change.relativePath);
        await this.#writeUnlocked(change.relativePath, change.value, operationId);
      }
      journal.status = "committed";
      journal.completedAt = new Date(this.clock()).toISOString();
      await this.#writeJournal(journal);
      await Promise.all(journal.changes.filter((entry) => entry.backup).map((entry) => rm(path.join(this.root, entry.backup), { force: true })));
      return { operationId, committed: true, changes: ordered.map((entry) => entry.relativePath) };
    } catch (error) {
      await this.#restoreJournal(journal);
      throw error;
    } finally {
      for (const release of releases.reverse()) await release();
    }
  }

  async snapshot(relativePaths, { id = new Date(this.clock()).toISOString().replace(/[:.]/g, "-") } = {}) {
    const directory = path.join(this.root, SNAPSHOT_ROOT, id);
    const entries = [];
    await mkdir(directory, { recursive: true });
    for (const relativePath of relativePaths) {
      const source = this.#target(relativePath);
      if (!(await exists(source))) continue;
      const destination = path.join(directory, relativePath.replaceAll(/[\\/]/g, "__"));
      await copyFile(source, destination);
      entries.push({ relativePath, file: path.relative(this.root, destination) });
    }
    const manifest = { schemaVersion: 1, id, createdAt: new Date(this.clock()).toISOString(), entries };
    await this.#atomicWrite(path.join(directory, "snapshot.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  }

  async validate(relativePath, validate) {
    try {
      const value = await this.read(relativePath, { validate });
      return { relativePath, valid: true, checksum: checksum(`${JSON.stringify(value, null, 2)}\n`) };
    } catch (error) {
      return { relativePath, valid: false, error: { code: error.code ?? "STATE_READ_FAILED", message: error.message } };
    }
  }

  async history() {
    const directory = path.join(this.root, JOURNAL_ROOT);
    try {
      const files = (await readdir(directory)).filter((entry) => entry.endsWith(".json")).sort();
      return Promise.all(files.map((file) => this.#readJournal(path.join(directory, file))));
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async recover() {
    const journals = await this.history();
    const recovered = [];
    for (const journal of journals.filter((entry) => entry.status === "prepared")) {
      await this.#restoreJournal(journal);
      recovered.push(journal.operationId);
    }
    return { recovered };
  }

  async withLock(relativePath, work) {
    const release = await this.#acquireLock(relativePath);
    try { return await work(); }
    finally { await release(); }
  }

  #target(relativePath) {
    const target = path.resolve(this.root, relativePath);
    const workspace = path.resolve(this.root, STATE_ROOT);
    if (target !== workspace && !target.startsWith(`${workspace}${path.sep}`)) throw new StateError("STATE_PATH_INVALID", "State paths must remain inside .ai-workspace.", { relativePath });
    return target;
  }

  async #writeUnlocked(relativePath, value, operationId) {
    const target = this.#target(relativePath);
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    await mkdir(path.dirname(target), { recursive: true });
    await this.#atomicWrite(target, serialized, operationId);
    await this.#atomicWrite(`${target}.sha256`, `${checksum(serialized)}\n`, operationId);
    return value;
  }

  async #atomicWrite(target, serialized, operationId = randomUUID()) {
    const temporary = `${target}.${operationId}.tmp`;
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(serialized, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    try { await rename(temporary, target); }
    catch (error) { await rm(temporary, { force: true }); throw error; }
  }

  async #verifyChecksum(relativePath, serialized) {
    const checksumPath = `${this.#target(relativePath)}.sha256`;
    try {
      const expected = (await readFile(checksumPath, "utf8")).trim();
      const actual = checksum(serialized);
      if (expected !== actual) throw new StateError("STATE_CHECKSUM_MISMATCH", `Checksum validation failed for ${relativePath}.`, { relativePath, expected, actual });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  #validate(value, validate, relativePath) {
    if (!validate) return;
    const result = validate(value);
    if (result === true || result === undefined) return;
    const issues = Array.isArray(result) ? result : [result || "Validation failed."];
    throw new StateError("STATE_SCHEMA_INVALID", `State validation failed for ${relativePath}.`, { relativePath, issues });
  }

  async #acquireLock(relativePath) {
    const lockName = createHash("sha256").update(relativePath).digest("hex");
    const target = path.join(this.root, LOCK_ROOT, `${lockName}.lock`);
    await mkdir(path.dirname(target), { recursive: true });
    const started = this.clock();
    while (true) {
      try {
        const handle = await open(target, "wx", 0o600);
        await handle.writeFile(JSON.stringify({ pid: process.pid, relativePath, acquiredAt: new Date(this.clock()).toISOString() }));
        await handle.close();
        return async () => rm(target, { force: true });
      } catch (error) {
        if (!["EEXIST", "EPERM"].includes(error?.code)) throw error;
        const info = await stat(target).catch(() => null);
        if (info && this.clock() - info.mtimeMs > this.staleLockMs) { await rm(target, { force: true }); continue; }
        if (this.clock() - started >= this.lockTimeoutMs) throw new StateError("STATE_LOCK_TIMEOUT", `Timed out waiting for state lock ${relativePath}.`, { relativePath, lockTimeoutMs: this.lockTimeoutMs });
        await delay(25);
      }
    }
  }

  async #writeJournal(journal) {
    this.#validateJournal(journal);
    const target = path.join(this.root, JOURNAL_ROOT, `${journal.operationId}.json`);
    await mkdir(path.dirname(target), { recursive: true });
    await this.#atomicWrite(target, `${JSON.stringify(journal, null, 2)}\n`);
  }

  async #restoreJournal(journal) {
    this.#validateJournal(journal);
    const changes = [...journal.changes].reverse();
    for (const change of changes) {
      if (change.backup && !(await exists(this.#backupPath(change.relativePath, journal.operationId)))) {
        throw new StateError("STATE_JOURNAL_BACKUP_MISSING", `Recovery backup is missing for ${change.relativePath}.`, { operationId: journal.operationId, relativePath: change.relativePath });
      }
    }
    for (const change of changes) {
      const target = this.#target(change.relativePath);
      if (change.backup) {
        const backup = this.#backupPath(change.relativePath, journal.operationId);
        await copyFile(backup, target);
        const restored = await readFile(target, "utf8");
        await this.#atomicWrite(`${target}.sha256`, `${checksum(restored)}\n`);
        await rm(backup, { force: true });
      } else {
        await rm(target, { force: true });
        await rm(`${target}.sha256`, { force: true });
      }
    }
    journal.status = "rolled-back";
    journal.recoveredAt = new Date(this.clock()).toISOString();
    await this.#writeJournal(journal);
  }

  async #readJournal(target) {
    let journal;
    try {
      journal = JSON.parse(await readFile(target, "utf8"));
    } catch (error) {
      if (error instanceof SyntaxError) throw new StateError("STATE_JOURNAL_CORRUPT", `State journal ${path.basename(target)} is not valid JSON.`, { journal: path.basename(target), cause: error.message });
      throw error;
    }
    this.#validateJournal(journal, path.basename(target));
    return journal;
  }

  #validateJournal(journal, source = "transaction") {
    if (!journal || typeof journal !== "object" || Array.isArray(journal) || journal.schemaVersion !== JOURNAL_SCHEMA_VERSION || typeof journal.operationId !== "string" || !journal.operationId || !JOURNAL_STATUSES.has(journal.status) || typeof journal.startedAt !== "string" || !Array.isArray(journal.changes)) {
      throw new StateError("STATE_JOURNAL_CORRUPT", `State journal ${source} has an invalid structure.`, { source });
    }
    for (const change of journal.changes) {
      if (!change || typeof change !== "object" || typeof change.relativePath !== "string" || (change.backup !== null && typeof change.backup !== "string")) {
        throw new StateError("STATE_JOURNAL_CORRUPT", `State journal ${source} has an invalid change entry.`, { source });
      }
      try {
        this.#target(change.relativePath);
      } catch {
        throw new StateError("STATE_JOURNAL_CORRUPT", `State journal ${source} references an unsafe state path.`, { source, relativePath: change.relativePath });
      }
      if (change.backup !== null) {
        const expected = path.relative(this.root, this.#backupPath(change.relativePath, journal.operationId));
        if (path.isAbsolute(change.backup) || path.normalize(change.backup) !== expected) {
          throw new StateError("STATE_JOURNAL_CORRUPT", `State journal ${source} references an unexpected backup path.`, { source, relativePath: change.relativePath });
        }
      }
    }
  }

  #backupPath(relativePath, operationId) {
    return `${this.#target(relativePath)}.${operationId}.backup`;
  }
}

function checksum(value) { return createHash("sha256").update(value).digest("hex"); }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
