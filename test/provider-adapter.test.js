import assert from "node:assert/strict";
import test from "node:test";
import { createProviderAdapter, PROVIDER_ADAPTER_VERSION, ProviderCapabilityError, providerCompatibilityMatrix } from "../src/provider-adapter.js";

test("provider adapters expose a stable compatibility contract", () => {
  const adapter = createProviderAdapter(".", "openai");
  const metadata = adapter.metadata();
  assert.equal(metadata.schemaVersion, PROVIDER_ADAPTER_VERSION);
  assert.equal(metadata.name, "openai");
  assert.equal(adapter.supports("generate"), true);
  assert.equal(providerCompatibilityMatrix(".").length, 8);
});

test("provider adapters deny undeclared capabilities", async () => {
  const adapter = createProviderAdapter(".", "openai");
  await assert.rejects(() => adapter.models(), (error) => error instanceof ProviderCapabilityError && error.code === "provider_capability_unavailable");
});

test("provider adapters dispatch through injected implementations", async () => {
  const calls = [];
  const adapter = createProviderAdapter("workspace", "openai", {
    status: async (...args) => { calls.push(["status", ...args]); return { healthy: true }; },
    invoke: async (...args) => { calls.push(["invoke", ...args]); return { text: "ok" }; },
  });
  assert.equal((await adapter.health()).healthy, true);
  assert.equal((await adapter.invoke({ prompt: "hello" })).text, "ok");
  assert.deepEqual(calls.map(([operation]) => operation), ["status", "invoke"]);
});
