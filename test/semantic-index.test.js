import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProjectIndex } from "../src/project-index.js";
import { buildSemanticIndex, configureSemanticIndex, embedTexts, querySemanticIndex, semanticIndexStatus } from "../src/semantic-index.js";

test("semantic index stores embeddings and approved metadata only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-semantic-"));
  const embedImpl = async (_root, _provider, _model, inputs) => inputs.map((text) => [text.includes("main") ? 1 : 0, text.length / 100]);
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "main.js"), `export function main() { return "private-source-text"; }\n`);
    await writeFile(path.join(root, "src", "helper.js"), `export function helper() { return true; }\n`);
    await buildProjectIndex(root, { dryRun: false });
    await configureSemanticIndex(root, { enabled: true, provider: "ollama", model: "embeddinggemma", metadataFields: ["path", "kind", "symbols"] }, { dryRun: false });
    const built = await buildSemanticIndex(root, { embedImpl });
    assert.equal(built.storesSourceContent, false);
    const result = await querySemanticIndex(root, "main", { embedImpl });
    assert.equal(result.results[0].id, "src/main.js");
    assert.equal(result.sourceContentReturned, false);
    assert.equal(JSON.stringify(await semanticIndexStatus(root)).includes("private-source-text"), false);
    await assert.rejects(() => configureSemanticIndex(root, { metadataFields: ["symbols"] }, { dryRun: false }), /must include path/);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("embedding adapters normalize OpenAI, Gemini, and Ollama responses", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-embedding-adapters-"));
  const previousOpenAI = process.env.OPENAI_API_KEY, previousGemini = process.env.GEMINI_API_KEY;
  process.env.OPENAI_API_KEY = "test-openai"; process.env.GEMINI_API_KEY = "test-gemini";
  try {
    const response = (payload) => async () => ({ ok: true, status: 200, text: async () => JSON.stringify(payload) });
    assert.deepEqual(await embedTexts(root, "openai", "text-embedding-3-small", ["a"], { fetchImpl: response({ data: [{ index: 0, embedding: [1, 2] }] }) }), [[1, 2]]);
    assert.deepEqual(await embedTexts(root, "gemini", "gemini-embedding-001", ["a"], { fetchImpl: response({ embeddings: [{ values: [2, 3] }] }) }), [[2, 3]]);
    assert.deepEqual(await embedTexts(root, "ollama", "embeddinggemma", ["a"], { fetchImpl: response({ embeddings: [[3, 4]] }) }), [[3, 4]]);
  } finally { if (previousOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousOpenAI; if (previousGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousGemini; await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
