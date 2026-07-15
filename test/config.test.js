import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadConfig, setConfig } from "../src/config.js";

test("configuration defaults are available and writes require apply", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-config-"));
  try {
    assert.equal((await loadConfig(root)).logRetentionDays, 30);
    assert.equal((await setConfig(root, "logRetentionDays", "7")).dryRun, true);
    assert.equal((await setConfig(root, "logRetentionDays", "7", { dryRun: false })).config.logRetentionDays, 7);
  } finally { await rm(root, { recursive: true, force: true }); }
});
