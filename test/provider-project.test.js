import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { configureProjectProviders, readProjectProviderConfig } from "../src/provider-project.js";
import { discoverOllamaModels, invokeProvider, providerRuntimeStatus } from "../src/provider-runtime.js";

test("project provider routing is configurable without credentials", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-project-"));
  try {
    const configured = await configureProjectProviders(root, { defaultProvider: "ollama", fallbackProvider: "openai", embeddingProvider: "openai", model: "llama3.2", priority: ["ollama", "openai"], temperature: 0.3 }, { dryRun: false });
    assert.equal(configured.storesSecrets, false);
    assert.equal((await readProjectProviderConfig(root)).defaultProvider, "ollama");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Ollama supports health, discovery, and normalized local invocation", async () => {
  const fetchImpl = async (url) => url.endsWith("/api/tags")
    ? new Response(JSON.stringify({ models: [{ name: "llama3.2", size: 123 }] }), { status: 200 })
    : new Response(JSON.stringify({ model: "llama3.2", response: "local result", prompt_eval_count: 2, eval_count: 3 }), { status: 200 });
  assert.deepEqual(await discoverOllamaModels({ fetchImpl }), [{ name: "llama3.2", size: 123, modifiedAt: null }]);
  const status = await providerRuntimeStatus(process.cwd(), "ollama", { fetchImpl });
  assert.equal(status.kind, "local-model");
  const result = await invokeProvider(process.cwd(), "ollama", { prompt: "hello" }, { fetchImpl });
  assert.equal(result.text, "local result");
  assert.equal(result.kind, "local-model");
});
