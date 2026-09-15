import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { providerTestHistory, recordProviderTest } from "../src/provider-test-history.js";

test("provider test history retains bounded metadata and never response content", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-test-history-"));
  try {
    for (let index = 0; index < 22; index += 1) {
      await recordProviderTest(root, {
        provider: "gemini",
        model: "gemini-2.5-flash",
        operationId: `operation-${index}`,
        text: `restricted-response-${index}`,
        usage: { inputTokens: index, outputTokens: 1, hidden: "nope" },
        warnings: [{ code: "compatibility_missing", detail: "restricted-warning" }],
      });
    }
    const history = await providerTestHistory(root);
    assert.equal(history.records.length, 20);
    assert.equal(history.records[0].operationId, "operation-2");
    assert.doesNotMatch(JSON.stringify(history), /restricted-response|restricted-warning|hidden/);
    assert.equal(history.records.at(-1).usage.inputTokens, 21);
    assert.deepEqual(history.records.at(-1).warningCodes, ["compatibility_missing"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider test history rejects malformed persisted records", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-test-history-invalid-"));
  try {
    const target = path.join(root, ".ai-workspace", "providers", "test-history.json");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify({ schemaVersion: 1, records: [{ provider: "gemini" }] })}\n`, "utf8");
    await assert.rejects(() => providerTestHistory(root), /State validation failed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
