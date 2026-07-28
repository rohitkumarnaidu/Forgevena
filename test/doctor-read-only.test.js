import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { doctorCommand } from "../src/cli/handlers/platform.js";

test("doctor is read-only unless apply is explicit", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-doctor-"));
  try {
    const preview = await doctorCommand(root, { dryRun: true });
    assert.equal(preview.registry.dryRun, true);
    await assert.rejects(access(path.join(root, ".ai-workspace")));

    const applied = await doctorCommand(root, { dryRun: false });
    assert.equal(applied.registry.recorded, true);
    const health = JSON.parse(await readFile(path.join(root, ".ai-workspace", "health.json"), "utf8"));
    assert.equal(health.schemaVersion, 1);
    const log = await readFile(path.join(root, ".ai-workspace", "logs", "doctor.log"), "utf8");
    assert.match(log, /\"type\":\"doctor\"/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
