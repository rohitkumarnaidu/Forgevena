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

test("provider adapters emit ordered stream events and cancel active operations", async () => {
  let streamSignal;
  const adapter = createProviderAdapter("workspace", "openai", {
    stream: async function* (_root, _provider, _request, options) {
      streamSignal = options.signal;
      yield { type: "content-delta", delta: "ok" };
      if (!options.signal.aborted) await new Promise((resolve) => options.signal.addEventListener("abort", resolve, { once: true }));
      const error = new Error("Provider request was cancelled.");
      error.code = "cancellation";
      throw error;
    },
  });
  const iterator = adapter.stream({ prompt: "hello", operationId: "stream-operation" });
  assert.deepEqual((await iterator.next()).value, { type: "start", operationId: "stream-operation", sequence: 0, provider: "openai" });
  assert.equal((await iterator.next()).value.sequence, 1);
  assert.equal(streamSignal.aborted, false);
  assert.deepEqual(adapter.cancel("stream-operation"), { operationId: "stream-operation", cancelled: true });
  const terminal = await iterator.next();
  assert.equal(terminal.value.type, "error");
  assert.equal(terminal.value.error.code, "cancellation");
  assert.equal((await iterator.next()).done, true);
});

test("provider adapter validates tool and structured-output declarations", () => {
  const adapter = createProviderAdapter(".", "openai");
  assert.equal(adapter.validateConfiguration({ provider: "openai", timeoutMs: 1000, tools: [{ name: "lookup" }], structuredOutput: { type: "object" } }).valid, true);
  assert.equal(adapter.validateConfiguration({ provider: "ollama", timeoutMs: 0 }).valid, false);
  assert.equal(adapter.metadata().service, "OpenAI");
  assert.equal(adapter.metadata().support, "stable");
});
