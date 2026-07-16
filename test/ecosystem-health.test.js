import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { inspectEcosystem, recordEcosystemHealth } from "../src/ecosystem-health.js";

test("ecosystem health aggregates every platform domain without exposing secrets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ecosystem-health-"));
  try {
    const health = await inspectEcosystem(root);
    assert.ok(health.sections.providers.length >= 8);
    assert.ok(health.sections.credentials.length >= 10);
    assert.equal(health.sections.clouds.length, 8);
    assert.doesNotMatch(JSON.stringify(health), /API_KEY=/);
    assert.equal((await recordEcosystemHealth(root, health, { dryRun: false })).recorded, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
