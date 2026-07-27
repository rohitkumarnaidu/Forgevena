import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProjectIndex } from "../src/project-index.js";
import { buildSemanticIndex, configureSemanticIndex, embedTexts, querySemanticIndex, semanticIndexPlan, semanticIndexStatus } from "../src/semantic-index.js";

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

test("semantic configuration and plans enforce approved privacy boundaries", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-semantic-config-"));
  try {
    const preview = await configureSemanticIndex(root, { enabled: true, provider: "ollama", metadataFields: ["path", "relationships", "path"], maxEntries: 25 });
    assert.equal(preview.dryRun, true);
    assert.deepEqual(preview.next.metadataFields, ["path", "relationships"]);
    assert.equal(preview.next.storesSourceContent, false);
    assert.equal((await semanticIndexPlan(root, "build")).external, false);
    assert.equal((await semanticIndexPlan(root, "query")).affectedPaths.length, 0);
    await assert.rejects(() => configureSemanticIndex(root, { provider: "unknown" }), /must be one of/);
    await assert.rejects(() => configureSemanticIndex(root, { metadataFields: ["path", "contents"] }), /Approved metadata fields/);
    await assert.rejects(() => configureSemanticIndex(root, { maxEntries: 0 }), /between 1 and 5000/);
    await assert.rejects(() => configureSemanticIndex(root, { maxEntries: 5001 }), /between 1 and 5000/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("semantic build and query reject missing state and invalid vector batches", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-semantic-invalid-"));
  try {
    await assert.rejects(() => buildSemanticIndex(root), /disabled/);
    await assert.rejects(() => querySemanticIndex(root, ""), /must not be empty/);
    await assert.rejects(() => querySemanticIndex(root, "query"), /not initialized/);

    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "main.js"), "export const value = 1;\n");
    await buildProjectIndex(root, { dryRun: false });
    await configureSemanticIndex(root, { enabled: true, provider: "ollama", metadataFields: ["path", "kind", "relationships"] }, { dryRun: false });
    await assert.rejects(() => buildSemanticIndex(root, { embedImpl: async () => [] }), /invalid vector batch/);
    await assert.rejects(() => buildSemanticIndex(root, { embedImpl: async () => [[Number.NaN]] }), /invalid vector batch/);

    await buildSemanticIndex(root, { embedImpl: async (_root, _provider, _model, inputs) => inputs.map(() => [0, 0]) });
    const zeroScore = await querySemanticIndex(root, "query", { limit: 0, embedImpl: async () => [[0, 0]] });
    assert.equal(zeroScore.results[0].score, 0);
    const mismatched = await querySemanticIndex(root, "query", { limit: 500, embedImpl: async () => [[1]] });
    assert.equal(mismatched.results[0].score, -1);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

test("embedding adapters fail closed for unsupported, unauthenticated, malformed, and rejected responses", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-embedding-errors-"));
  const previousOpenAI = process.env.OPENAI_API_KEY;
  const previousGemini = process.env.GEMINI_API_KEY;
  const previousOllama = process.env.OLLAMA_HOST;
  try {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    await assert.rejects(() => embedTexts(root, "unknown", "model", ["a"]), /Unsupported embedding provider/);
    await assert.rejects(() => embedTexts(root, "openai", "model", ["a"]), /Missing OPENAI_API_KEY/);
    await assert.rejects(() => embedTexts(root, "gemini", "model", ["a"]), /Missing GEMINI_API_KEY/);

    process.env.OLLAMA_HOST = "http://localhost:11434/";
    await assert.rejects(() => embedTexts(root, "ollama", "model", ["a"], { fetchImpl: async () => ({ ok: false, status: 503, text: async () => "{}" }) }), /HTTP 503/);
    await assert.rejects(() => embedTexts(root, "ollama", "model", ["a"], { fetchImpl: async () => ({ ok: true, status: 200, text: async () => "{" }) }), SyntaxError);
    assert.deepEqual(await embedTexts(root, "ollama", "model", ["a"], { fetchImpl: async () => ({ ok: true, status: 200, text: async () => "" }) }), []);
  } finally {
    if (previousOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousOpenAI;
    if (previousGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousGemini;
    if (previousOllama === undefined) delete process.env.OLLAMA_HOST; else process.env.OLLAMA_HOST = previousOllama;
    await rm(root, { recursive: true, force: true });
  }
});
