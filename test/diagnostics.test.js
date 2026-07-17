import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createDiagnosticBundle, diagnosticsProfile, measureOperation, readMetrics, readTraces, recordCrash, recordMetric } from "../src/diagnostics.js";
import { logEvent } from "../src/logging.js";

test("diagnostics aggregate metrics and bounded trace spans", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-diagnostics-"));
  try {
    await recordMetric(root, "cli.duration_ms", 10, { command: "doctor", token: "hidden" });
    await measureOperation(root, "state.read", async () => "ok", { path: ".ai-workspace/workspace.json" });
    const metrics = await readMetrics(root);
    assert.equal(metrics.metrics["cli.duration_ms"].count, 1);
    assert.equal(metrics.metrics["cli.duration_ms"].labels.token, "[REDACTED]");
    assert.equal((await readTraces(root)).spans.length, 1);
    assert.equal((await diagnosticsProfile(root)).secretsIncluded, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("diagnostic bundles exclude secrets and log contents", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-bundle-"));
  try {
    await logEvent(root, "error", { authorization: "Bearer live-token", message: "api_key=example-sensitive-value" });
    await recordCrash(root, new Error("Bearer private-value"), { password: "unsafe" });
    const preview = await createDiagnosticBundle(root, { dryRun: true });
    assert.equal(preview.dryRun, true);
    const created = await createDiagnosticBundle(root, { dryRun: false });
    const serialized = await readFile(path.join(root, created.path), "utf8");
    assert.equal(serialized.includes("live-token"), false);
    assert.equal(serialized.includes("private-value"), false);
    assert.equal(serialized.includes("unsafe"), false);
    assert.equal(serialized.includes("log contents"), true);
    assert.equal(JSON.parse(serialized).secretsIncluded, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
