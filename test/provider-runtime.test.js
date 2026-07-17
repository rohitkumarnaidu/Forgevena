import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { invokeProvider, providerAuthPlan, ProviderRequestError } from "../src/provider-runtime.js";
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
