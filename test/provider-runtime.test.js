import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { discoverOllamaModels, executeProviderAuth, invokeProvider, providerAuthPlan, providerDefinition, providerRuntimeStatus, ProviderRequestError } from "../src/provider-runtime.js";
import { readProviderPolicy, setProviderPolicy } from "../src/provider-policy.js";

test("OpenAI runtime normalizes responses without returning credentials", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-runtime-"));
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "secret-that-must-not-leak";
  try {
    let request;
    const result = await invokeProvider(root, "openai", { prompt: "hello", model: "test-model" }, {
      fetchImpl: async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({ id: "resp_1", model: "test-model", output_text: "world", usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200 });
      },
    });
    assert.equal(request.url, "https://api.openai.com/v1/responses");
    assert.equal(JSON.parse(request.options.body).input, "hello");
    assert.equal(result.text, "world");
    assert.doesNotMatch(JSON.stringify(result), /secret-that-must-not-leak/);
    assert.equal((await readProviderPolicy(root, "openai")).usage.requests, 1);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("provider policies enforce request budgets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-budget-"));
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  try {
    await setProviderPolicy(root, "openai", { mode: "budgeted", monthlyRequestLimit: 1 }, { dryRun: false });
    const fetchImpl = async () => new Response(JSON.stringify({ output_text: "ok" }), { status: 200 });
    await invokeProvider(root, "openai", { prompt: "first" }, { fetchImpl });
    await assert.rejects(() => invokeProvider(root, "openai", { prompt: "second" }, { fetchImpl }), (error) => error instanceof ProviderRequestError && error.code === "budget_exceeded");
    const stored = await readFile(path.join(root, ".ai-workspace", "providers", "policies.json"), "utf8");
    assert.doesNotMatch(stored, /test-key/);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("host authentication plans never include credentials", () => {
  assert.deepEqual(providerAuthPlan("cursor", "login").args, ["login"]);
  assert.equal(providerAuthPlan("windsurf", "login").manualRequired, true);
});

test("all direct provider response contracts are normalized", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-contracts-"));
  const previous = { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
  process.env.ANTHROPIC_API_KEY = "anthropic-test";
  process.env.GEMINI_API_KEY = "gemini-test";
  process.env.OPENROUTER_API_KEY = "router-test";
  try {
    const claude = await invokeProvider(root, "claude", { prompt: "hello" }, { fetchImpl: async () => new Response(JSON.stringify({ id: "msg_1", model: "claude-test", content: [{ type: "text", text: "claude" }], usage: {} }), { status: 200 }) });
    const gemini = await invokeProvider(root, "gemini", { prompt: "hello" }, { fetchImpl: async () => new Response(JSON.stringify({ responseId: "gem_1", candidates: [{ content: { parts: [{ text: "gemini" }] } }], usageMetadata: {} }), { status: 200 }) });
    const openrouter = await invokeProvider(root, "openrouter", { prompt: "hello" }, { fetchImpl: async () => new Response(JSON.stringify({ id: "or_1", model: "router-test", choices: [{ message: { content: "openrouter" } }], usage: {} }), { status: 200 }) });
    assert.deepEqual([claude.text, gemini.text, openrouter.text], ["claude", "gemini", "openrouter"]);
  } finally {
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(root, { recursive: true, force: true });
  }
});

test("agent host invocation is capability-aware", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-host-"));
  try {
    const execImpl = async (_executable, args) => args[0] === "--version" ? { stdout: "1.0", stderr: "" } : { stdout: "agent response", stderr: "" };
    assert.equal((await invokeProvider(root, "cursor", { prompt: "hello" }, { execImpl })).text, "agent response");
    await assert.rejects(() => invokeProvider(root, "windsurf", { prompt: "hello" }, { execImpl }), (error) => error instanceof ProviderRequestError && error.code === "capability_unavailable");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider invocation retries only retryable failures", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-retry-"));
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  let calls = 0;
  try {
    const result = await invokeProvider(root, "openai", { prompt: "retry", retries: 2 }, { fetchImpl: async () => { calls += 1; return calls < 3 ? new Response(JSON.stringify({ error: { message: "busy" } }), { status: 503 }) : new Response(JSON.stringify({ id: "ok", model: "gpt", output_text: "done" }), { status: 200 }); } });
    assert.equal(result.attempts, 3);
    assert.equal(calls, 3);
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; await rm(root, { recursive: true, force: true }); }
});

test("provider retries honor retry-after and preserve idempotency", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-retry-after-"));
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const delays = [];
  const keys = [];
  let calls = 0;
  try {
    const result = await invokeProvider(root, "openai", { prompt: "retry", retries: 1 }, {
      randomImpl: () => 0,
      sleepImpl: async (milliseconds) => delays.push(milliseconds),
      fetchImpl: async (_url, options) => {
        calls += 1;
        keys.push(options.headers["idempotency-key"]);
        return calls === 1 ? new Response(JSON.stringify({ error: { message: "limited" } }), { status: 429, headers: { "retry-after": "0.01" } }) : new Response(JSON.stringify({ output_text: "ok" }), { status: 200 });
      },
    });
    assert.equal(result.text, "ok");
    assert.deepEqual(delays, [10]);
    assert.equal(keys[0], keys[1]);
    assert.match(keys[0], /^[0-9a-f-]{36}$/);
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; await rm(root, { recursive: true, force: true }); }
});

test("provider status and authentication cover API, local, and host providers", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-status-"));
  const previous = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    assert.equal((await providerRuntimeStatus(root, "openai")).credentialAvailable, false);
    process.env.OPENAI_API_KEY = "test-key";
    assert.equal((await providerRuntimeStatus(root, "openai")).credentialAvailable, true);
    const local = await providerRuntimeStatus(root, "ollama", { fetchImpl: async () => new Response(JSON.stringify({ models: [{ name: "local", size: 1 }] }), { status: 200 }) });
    assert.deepEqual(local.models, ["local"]);
    assert.equal((await providerRuntimeStatus(root, "ollama", { fetchImpl: async () => { throw new Error("offline"); } })).healthy, false);
    assert.equal((await providerRuntimeStatus(root, "codex", { execImpl: async () => ({ stdout: "1", stderr: "" }) })).executableAvailable, true);
    assert.equal((await providerRuntimeStatus(root, "codex", { execImpl: async () => { throw new Error("missing"); } })).executableAvailable, false);
    assert.throws(() => providerDefinition("missing"), /Choose one of/);
    assert.throws(() => providerAuthPlan("openai"), /API-key authentication/);
    assert.equal((await executeProviderAuth(providerAuthPlan("windsurf"))).supported, false);
    const auth = await executeProviderAuth(providerAuthPlan("codex", "logout"), { execImpl: async () => ({ stdout: " done \n", stderr: " warning \n" }) });
    assert.equal(auth.stdout, "done");
    assert.equal(auth.stderr, "warning");
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("provider invocation fails closed for invalid requests, credentials, hosts, and HTTP errors", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-errors-"));
  const previous = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(() => invokeProvider(root, "openai", { prompt: "hello" }), (error) => error.code === "credential_missing");
    await assert.rejects(() => invokeProvider(root, "ollama", { prompt: " " }), (error) => error.code === "invalid_request");
    await setProviderPolicy(root, "ollama", { maxInputCharacters: 3 }, { dryRun: false });
    await assert.rejects(() => invokeProvider(root, "ollama", { prompt: "long" }), (error) => error.code === "policy_limit");
    await assert.rejects(() => invokeProvider(root, "codex", { prompt: "hello" }, { execImpl: async () => { throw new Error("missing"); } }), (error) => error.code === "host_unavailable");
    process.env.OPENAI_API_KEY = "test-key";
    let calls = 0;
    await assert.rejects(() => invokeProvider(root, "openai", { prompt: "hello", retries: 2 }, { fetchImpl: async () => { calls += 1; return new Response(JSON.stringify({ error: { message: "bad request" } }), { status: 400 }); } }), (error) => error.status === 400 && error.retryable === false);
    assert.equal(calls, 1);
    await assert.rejects(() => invokeProvider(root, "openai", { prompt: "hello", retries: 0 }, { fetchImpl: async () => { throw new Error("network down"); } }), (error) => error.retryable === true && /network down/.test(error.message));
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("Ollama discovery normalizes optional metadata and rejects unhealthy responses", async () => {
  const models = await discoverOllamaModels({ fetchImpl: async () => new Response(JSON.stringify({ models: [{ name: "a" }, { name: "b", size: 2, modified_at: "today" }] }), { status: 200 }) });
  assert.deepEqual(models, [{ name: "a", size: null, modifiedAt: null }, { name: "b", size: 2, modifiedAt: "today" }]);
  assert.deepEqual(await discoverOllamaModels({ fetchImpl: async () => new Response(JSON.stringify({}), { status: 200 }) }), []);
  await assert.rejects(() => discoverOllamaModels({ fetchImpl: async () => new Response("{}", { status: 503 }) }), (error) => error.code === "local_model_unavailable");
});
