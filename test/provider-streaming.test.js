import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { streamProvider } from "../src/provider-runtime.js";

const FIXTURES = { openai: "openai.sse", claude: "claude.sse", gemini: "gemini.sse", openrouter: "openrouter.sse", ollama: "ollama.ndjson" };

test("all committed providers emit normalized ordered stream events", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-streams-"));
  const previous = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
  Object.assign(process.env, { OPENAI_API_KEY: "fixture", ANTHROPIC_API_KEY: "fixture", GEMINI_API_KEY: "fixture", OPENROUTER_API_KEY: "fixture" });
  try {
    for (const [provider, fixtureName] of Object.entries(FIXTURES)) {
      const fixture = await readFile(path.resolve("providers", "fixtures", fixtureName), "utf8");
      const events = [];
      const fetchImpl = async (_url, options) => {
        assert.equal(options.signal instanceof AbortSignal, true);
        assert.doesNotMatch(options.body, /fixture/);
        return new Response(fixture, { status: 200, headers: { "content-type": provider === "ollama" ? "application/x-ndjson" : "text/event-stream" } });
      };
      for await (const event of streamProvider(root, provider, { prompt: "hello" }, { fetchImpl, recordUsage: false })) events.push(event);
      assert.equal(events.some((event) => event.type === "content-delta"), true, `${provider} must emit content`);
      assert.equal(events.filter((event) => event.type === "complete").length, 1, `${provider} must complete exactly once`);
      assert.equal(events.some((event) => event.type === "error"), false);
    }
  } finally {
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(root, { recursive: true, force: true });
  }
});

test("provider streams fail closed on malformed payloads", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-stream-malformed-"));
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "fixture";
  try {
    const iterator = streamProvider(root, "openai", { prompt: "hello" }, { fetchImpl: async () => new Response("data: not-json\n\n", { status: 200 }), recordUsage: false });
    await assert.rejects(async () => { for await (const event of iterator) void event; }, (error) => error.code === "malformed_response" && !error.message.includes("not-json"));
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; await rm(root, { recursive: true, force: true }); }
});
