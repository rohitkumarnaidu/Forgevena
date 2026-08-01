import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { createProviderAdapter } from "../src/provider-adapter.js";

test("provider adapter overhead stays below the v1.4 p95 budget", async () => {
  const adapter = createProviderAdapter(".", "openai", { invoke: async () => ({ text: "fixture", usage: null }) });
  const samples = [];
  for (let index = 0; index < 1000; index += 1) {
    const startedAt = performance.now();
    await adapter.invoke({ prompt: "fixture", operationId: `performance-${index}` });
    samples.push(performance.now() - startedAt);
  }
  samples.sort((left, right) => left - right);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  assert.ok(p95 < 250, `ProviderAdapter p95 overhead ${p95.toFixed(2)}ms exceeds 250ms.`);
});

test("five hundred provider profile views remain memory bounded", () => {
  const before = process.memoryUsage().heapUsed;
  const profiles = Array.from({ length: 500 }, (_, index) => createProviderAdapter(".", ["openai", "claude", "gemini", "openrouter", "ollama"][index % 5]).metadata());
  const deltaMiB = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
  assert.equal(profiles.length, 500);
  assert.ok(deltaMiB < 32, `500 profile views consumed ${deltaMiB.toFixed(2)} MiB.`);
});
