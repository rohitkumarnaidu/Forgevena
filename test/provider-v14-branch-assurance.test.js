import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createProviderAdapter, ProviderCapabilityError } from "../src/provider-adapter.js";
import { verifyProviderCompatibility } from "../src/provider-compatibility.js";
import { InvocationCoordinator } from "../src/invocation-coordinator.js";
import {
  createCompatibilityEvidence,
  evidenceFreshness,
  profileFromDefinition,
  ProviderRegistry,
  ProviderRegistryError,
  validateCompatibilityEvidence,
  validateProviderProfile,
  validateProviderRegistry,
} from "../src/provider-registry.js";
import { executeProviderAuth, invokeProvider, ProviderRequestError, providerAuthPlan, providerRuntimeStatus, streamProvider } from "../src/provider-runtime.js";

async function workspace(prefix) { return mkdtemp(path.join(tmpdir(), prefix)); }

test("compatibility verifier rejects every unsupported evidence branch", async () => {
  const root = await workspace("provider-compatibility-branches-");
  try {
    assert.equal((await verifyProviderCompatibility(root)).valid, false);
    await mkdir(path.join(root, "providers", "fixtures"), { recursive: true });
    await writeFile(path.join(root, "providers", "compatibility-evidence.json"), "not-json");
    assert.equal((await verifyProviderCompatibility(root)).valid, false);
    const fixture = path.join("providers", "fixtures", "fixture.sse");
    await writeFile(path.join(root, fixture), "fixture");
    const records = [
      { provider: "openai", support: "stable", liveVerified: false, fixture, fixtureSha256: "bad" },
      { provider: "claude", support: "preview", liveVerified: true, fixture, fixtureSha256: "bad" },
      { provider: "gemini", support: "preview", liveVerified: false },
      { provider: "openrouter", support: "preview", liveVerified: false, fixture: "providers/fixtures/missing.sse", fixtureSha256: "bad" },
      { provider: "ollama", support: "preview", liveVerified: false, fixture, fixtureSha256: "bad" },
      { provider: "future", support: "preview", liveVerified: false, fixture, fixtureSha256: "bad" },
    ];
    await writeFile(path.join(root, "providers", "compatibility-evidence.json"), JSON.stringify({ providers: records }));
    const result = await verifyProviderCompatibility(root);
    assert.equal(result.valid, false);
    assert.match(result.issues.join("\n"), /cannot certify future|cannot claim stable|fixture reference is incomplete|fixture is missing|checksum does not match/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider adapter validates all capability and cancellation branches", async () => {
  const openai = createProviderAdapter(".", "openai");
  assert.equal(openai.validateConfiguration({ provider: "ollama", timeoutMs: "bad" }).valid, false);
  assert.deepEqual(openai.cancel("missing"), { operationId: "missing", cancelled: false, reason: "operation-not-running" });
  assert.throws(() => createProviderAdapter(".", "codex").require("stream"), ProviderCapabilityError);
  assert.equal(createProviderAdapter(".", "codex").validateConfiguration({ tools: [{}], structuredOutput: {} }).valid, false);
  const controller = new AbortController();
  controller.abort();
  const adapter = createProviderAdapter(".", "openai", { invoke: async (_root, _name, _request, options) => ({ aborted: options.signal.aborted }) });
  assert.equal((await adapter.invoke({ prompt: "x" }, { signal: controller.signal })).aborted, true);
  const models = createProviderAdapter(".", "ollama", { models: async () => ["local"] });
  assert.deepEqual(await models.models(), ["local"]);
  assert.equal(createProviderAdapter(".", "codex", { authPlan: () => ({ supported: true }) }).auth().supported, true);
});

test("provider registry validation fails closed across malformed records", async () => {
  assert.deepEqual(validateProviderRegistry(null), ["Registry must be an object."]);
  const issues = validateProviderRegistry({ schemaVersion: 2, profiles: [], compatibilityEvidence: [], updatedAt: "bad" });
  assert.equal(Array.isArray(issues), true);
  for (const value of [null, [], {}]) assert.throws(() => validateProviderProfile(value), ProviderRegistryError);
  assert.throws(() => validateProviderProfile({ provider: "future", capabilities: [], storesSecrets: false }), /Unknown provider/);
  assert.throws(() => validateProviderProfile({ provider: "openai", capabilities: [], storesSecrets: true }), /never store secrets/);
  assert.throws(() => validateProviderProfile({ provider: "openai", storesSecrets: false }), /capabilities must be an array/);
  const profile = validateProviderProfile({ provider: "openai", capabilities: ["generate", "generate"], allowedModels: ["a", "a"], storesSecrets: false });
  assert.deepEqual(profile.capabilities, ["generate"]);
  assert.deepEqual(profile.allowedModels, ["a"]);
  for (const value of [null, [], {}]) assert.throws(() => validateCompatibilityEvidence(value), ProviderRegistryError);
  assert.throws(() => validateCompatibilityEvidence({ id: "x", provider: "future", verifiedAt: "2026-01-01", expiresAt: "2026-02-01" }), /Unknown provider/);
  assert.throws(() => validateCompatibilityEvidence({ id: "x", provider: "openai", verifiedAt: "bad", expiresAt: "bad" }), /dates are invalid/);
  const local = createCompatibilityEvidence("ollama", { verifiedAt: new Date("2026-01-01T00:00:00Z") });
  assert.equal(evidenceFreshness(local, new Date("2026-06-01T00:00:00Z")), "current");
  assert.equal(local.expiresAt, "2026-06-30T00:00:00.000Z");
  assert.equal(profileFromDefinition("codex").support, "compatibility-only");
});

test("provider registry covers missing, duplicate, unregister, and no-op migration states", async () => {
  const root = await workspace("provider-registry-branches-");
  try {
    const registry = new ProviderRegistry(root, { clock: () => new Date("2026-08-01T00:00:00Z") });
    assert.deepEqual(await registry.compatibility("openai"), { evidence: null, freshness: "missing", support: "unsupported" });
    await assert.rejects(() => registry.compatibility("openai", { requireCurrent: true }), (error) => error.details.freshness === "missing");
    await registry.registerProfile(profileFromDefinition("openai"));
    assert.equal((await registry.migrationPlan({ legacyProfiles: { openai: {}, claude: {} } })).additions.length, 1);
    assert.equal((await registry.migrate({ legacyProfiles: { openai: {} }, dryRun: false })).dryRun, true);
    await registry.unregisterProfile("openai");
    assert.equal((await registry.read()).profiles.openai, undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("invocation coordinator rejects invalid budgets and unsafe fallback paths", async () => {
  const root = await workspace("provider-coordinator-branches-");
  try {
    const response = { text: "ok", usage: { totalTokens: 1, estimatedCost: 2 } };
    const adapterFactory = (_root, name) => ({ name, supports: (capability) => capability !== "missing", invoke: async () => response });
    const coordinator = new InvocationCoordinator(root, { adapterFactory });
    await assert.rejects(() => coordinator.invoke("openai", { prompt: "x", timeoutMs: 0 }), (error) => error.code === "invalid_request");
    await assert.rejects(() => coordinator.invoke("openai", { prompt: "x", retries: -1 }), (error) => error.code === "invalid_request");
    await assert.rejects(() => coordinator.invoke("openai", { prompt: "x", requiredCapabilities: ["missing"] }), (error) => error.code === "capability_unavailable");
    await assert.rejects(() => coordinator.invoke("openai", { prompt: "x", budget: { maxEstimatedCost: 1 } }), (error) => error.code === "budget_exhausted");
    const unavailable = new ProviderRequestError("offline", { code: "provider_unavailable", retryable: false });
    const fallback = new InvocationCoordinator(root, { adapterFactory: (_r, name) => ({ name, supports: () => true, invoke: async () => { throw unavailable; } }) });
    await assert.rejects(() => fallback.invoke("openai", { prompt: "x", allowFallback: false }, { fallbackProviders: ["ollama", "ollama", "openai"] }), (error) => error.code === "policy_denial");
    const transport = new InvocationCoordinator(root, { adapterFactory: (_r, name) => ({ name, supports: () => true, invoke: async () => { throw new Error("secret transport detail"); } }), sleep: async () => {} });
    await assert.rejects(() => transport.invoke("openai", { prompt: "x", retries: 0, budget: { maxAttempts: 1 } }), (error) => error.code === "transport" && !error.message.includes("secret"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider stream and host auth cover metadata, empty, and manual branches", async () => {
  const root = await workspace("provider-stream-branches-");
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "fixture";
  try {
    const metadataOnly = "event: response\nid: 1\nretry: 100\n: keepalive\ndata: {\"type\":\"response.function_call_arguments.delta\",\"item_id\":\"call\",\"name\":\"lookup\",\"delta\":\"{}\"}\n\n";
    const events = [];
    for await (const event of streamProvider(root, "openai", { prompt: "x" }, { fetchImpl: async () => new Response(metadataOnly), recordUsage: false })) events.push(event);
    assert.deepEqual(events.map((event) => event.type), ["tool-call", "complete"]);
    await assert.rejects(async () => { for await (const event of streamProvider(root, "openai", { prompt: "x" }, { fetchImpl: async () => new Response(null), recordUsage: false })) void event; }, /response body/);
    assert.throws(() => providerAuthPlan("openai"), /API-key authentication/);
    assert.equal(providerAuthPlan("windsurf").manualRequired, true);
    assert.equal((await executeProviderAuth({ supported: false, provider: "windsurf" })).supported, false);
    const executed = await executeProviderAuth({ supported: true, provider: "codex", action: "login", executable: "codex", args: ["login"] }, { execImpl: async () => ({ stdout: " ok \n", stderr: " warning \n" }) });
    assert.equal(executed.stdout, "ok");
    assert.equal(executed.stderr, "warning");
  } finally { if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; await rm(root, { recursive: true, force: true }); }
});

test("all provider stream event variants normalize without raw payload leakage", async () => {
  const root = await workspace("provider-stream-variants-");
  const previous = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
  Object.assign(process.env, { OPENAI_API_KEY: "fixture", ANTHROPIC_API_KEY: "fixture", GEMINI_API_KEY: "fixture", OPENROUTER_API_KEY: "fixture" });
  const samples = {
    openai: [
      { type: "response.output_text.delta" },
      { type: "response.function_call_arguments.delta" },
      { type: "response.completed", response: {} },
      { type: "unknown" },
    ],
    claude: [
      { type: "content_block_start", content_block: { type: "tool_use", id: "tool", name: "lookup" } },
      { type: "content_block_delta", delta: { text: "hello" } },
      { type: "content_block_delta", delta: { partial_json: "{}" } },
      { type: "message_delta" },
      { type: "message_stop" },
      { type: "unknown" },
    ],
    gemini: [{ candidates: [{ content: { parts: [{ text: "hello" }, { functionCall: { name: "lookup" } }, {}] }, finishReason: "STOP" }], usageMetadata: { totalTokenCount: 1 } }, {}],
    openrouter: [{ choices: [{ delta: { content: "hello", tool_calls: [{ id: "tool" }] }, finish_reason: "stop" }], usage: { total_tokens: 1 } }, {}],
    ollama: [{ response: "hello" }, { done: true }],
  };
  try {
    for (const [provider, payloads] of Object.entries(samples)) {
      const body = payloads.map((payload) => `${provider === "ollama" ? "" : "data: "}${JSON.stringify(payload)}\n`).join("") + (provider === "openai" ? "data: [DONE]\n" : "");
      const events = [];
      for await (const event of streamProvider(root, provider, { messages: [{ role: "system", content: "rules" }, { role: "assistant", content: "ready" }, { role: "tool", content: "result" }, { role: "user", content: "go" }], tools: [{ name: "lookup" }], structuredOutput: { type: "object" } }, { fetchImpl: async () => new Response(body), recordUsage: false })) events.push(event);
      assert.equal(events.some((event) => event.type === "complete"), true, provider);
      if (provider !== "ollama") assert.equal(events.some((event) => event.type === "tool-call"), true, provider);
    }
  } finally {
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(root, { recursive: true, force: true });
  }
});

test("provider invocation covers body projections, status classes, and cancellation", async () => {
  const root = await workspace("provider-invoke-variants-");
  const previous = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY, OLLAMA_HOST: process.env.OLLAMA_HOST };
  Object.assign(process.env, { OPENAI_API_KEY: "fixture", ANTHROPIC_API_KEY: "fixture", GEMINI_API_KEY: "fixture", OPENROUTER_API_KEY: "fixture", OLLAMA_HOST: "http://localhost:11434/" });
  const responses = {
    openai: { output: [{ content: [{ type: "output_text", text: "ok" }, { type: "ignored" }] }] },
    claude: { content: [{ type: "text", text: "ok" }, { type: "tool_use" }] },
    gemini: { candidates: [{ content: { parts: [{ text: "ok" }, {}] } }] },
    openrouter: { choices: [{ message: {} }] },
    ollama: { response: "ok" },
  };
  try {
    for (const [provider, payload] of Object.entries(responses)) {
      let body;
      const result = await invokeProvider(root, provider, { messages: [{ role: "system", content: "rules" }, { role: "assistant", content: "ready" }, { role: "user", content: "go" }], tools: [{ name: "lookup" }], structuredOutput: { type: "object" }, retries: 0 }, { fetchImpl: async (_url, options) => { body = JSON.parse(options.body); return Response.json(payload); }, recordUsage: false });
      assert.equal(result.text ?? "", provider === "openrouter" ? "" : "ok");
      assert.equal(Boolean(body.model), provider !== "gemini");
    }
    for (const [status, code] of [[401, "authentication"], [402, "quota"], [403, "authorization"], [404, "model_unavailable"], [408, "timeout"], [429, "rate_limit"], [500, "provider_unavailable"], [400, "invalid_request"]]) {
      await assert.rejects(() => invokeProvider(root, "openai", { prompt: "x", retries: 0 }, { fetchImpl: async () => new Response("", { status }), recordUsage: false }), (error) => error.code === code);
    }
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(() => invokeProvider(root, "openai", { prompt: "x", retries: 0 }, { signal: controller.signal, fetchImpl: async () => { throw new DOMException("aborted", "AbortError"); }, recordUsage: false }), (error) => error.code === "cancellation" && error.retryable === false);
    assert.equal((await providerRuntimeStatus(root, "ollama", { fetchImpl: async () => { throw new Error("offline"); } })).healthy, false);
    assert.equal((await providerRuntimeStatus(root, "codex", { execImpl: async () => ({ stdout: "1" }) })).executableAvailable, true);
  } finally {
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(root, { recursive: true, force: true });
  }
});

test("provider streaming fails closed for host, credential, HTTP, and abort boundaries", async () => {
  const root = await workspace("provider-stream-errors-");
  const previous = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(async () => { for await (const event of streamProvider(root, "openai", { prompt: "x" })) void event; }, (error) => error.code === "credential_missing");
    await assert.rejects(async () => { for await (const event of streamProvider(root, "codex", { prompt: "x" })) void event; }, (error) => error.code === "capability_unavailable");
    process.env.OPENAI_API_KEY = "fixture";
    await assert.rejects(async () => { for await (const event of streamProvider(root, "openai", { prompt: "x" }, { fetchImpl: async () => new Response("denied", { status: 403 }), recordUsage: false })) void event; }, (error) => error.code === "authorization" && !error.message.includes("denied"));
    const external = new AbortController();
    external.abort();
    await assert.rejects(async () => { for await (const event of streamProvider(root, "openai", { prompt: "x" }, { signal: external.signal, fetchImpl: async () => { throw new DOMException("aborted", "AbortError"); }, recordUsage: false })) void event; }, (error) => error.code === "cancellation");
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; await rm(root, { recursive: true, force: true }); }
});
