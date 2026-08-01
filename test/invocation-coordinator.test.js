import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { InvocationCoordinator } from "../src/invocation-coordinator.js";
import { ProviderRequestError } from "../src/provider-runtime.js";

function factory(sequence, calls) {
  return (_root, provider) => ({
    name: provider,
    supports: (capability) => capability !== "missing",
    invoke: async (request) => { calls.push({ provider, request }); const next = sequence.shift(); if (next instanceof Error) throw next; return next; },
  });
}

test("invocation coordinator applies bounded retries within one operation", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coordinator-retry-"));
  const calls = [];
  try {
    const coordinator = new InvocationCoordinator(root, { adapterFactory: factory([new ProviderRequestError("busy", { provider: "openai", retryable: true, code: "rate_limit", retryAfterMs: 1 }), { text: "ok", usage: null }], calls), sleep: async () => {}, random: () => 0 });
    const result = await coordinator.invoke("openai", { prompt: "hello", retries: 1, idempotency: "read-only" });
    assert.equal(result.attempts, 2);
    assert.equal(calls[0].request.operationId, calls[1].request.operationId);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("fallback is explicit and denied after committed effects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coordinator-fallback-"));
  try {
    const unavailable = new ProviderRequestError("offline", { provider: "openai", retryable: false, code: "provider_unavailable" });
    const calls = [];
    const coordinator = new InvocationCoordinator(root, { adapterFactory: factory([unavailable, { text: "fallback", usage: null }], calls) });
    const result = await coordinator.invoke("openai", { prompt: "hello", retries: 0, idempotency: "read-only", allowFallback: true }, { fallbackProviders: ["ollama"] });
    assert.equal(result.provider, "ollama");
    assert.equal(result.fallbackUsed, true);
    const denied = new InvocationCoordinator(root, { adapterFactory: factory([unavailable], []) });
    await assert.rejects(() => denied.invoke("openai", { prompt: "hello", retries: 0, idempotency: "non-idempotent", allowFallback: true, externalEffectCommitted: true }, { fallbackProviders: ["ollama"] }), (error) => error.code === "unsafe_retry");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("invocation coordinator exposes cancellation status", () => {
  const coordinator = new InvocationCoordinator(".");
  assert.deepEqual(coordinator.cancel("missing"), { operationId: "missing", cancelled: false, reason: "operation-not-running" });
});

test("invocation coordinator enforces response and compatibility budgets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coordinator-budget-"));
  try {
    const registryCalls = [];
    const coordinator = new InvocationCoordinator(root, {
      registry: { compatibility: async (...args) => { registryCalls.push(args); return { freshness: "current" }; } },
      adapterFactory: factory([{ text: "too large", usage: { totalTokens: 11 } }], []),
    });
    await assert.rejects(() => coordinator.invoke("openai", { prompt: "hello", retries: 0, requireCurrentCompatibility: true, budget: { maxAttempts: 1, maxTotalTokens: 10 } }), (error) => error.code === "budget_exhausted");
    assert.deepEqual(registryCalls, [["openai", { requireCurrent: true }]]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
