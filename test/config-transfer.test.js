import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { exportSafeConfiguration, importSafeConfiguration } from "../src/config-transfer.js";
import { configureProjectProviders } from "../src/provider-project.js";

test("safe configuration export and import contain references but no credentials", async () => {
  const source = await mkdtemp(path.join(tmpdir(), "config-export-"));
  const destination = await mkdtemp(path.join(tmpdir(), "config-import-"));
  try {
    await configureProjectProviders(source, { defaultProvider: "ollama", fallbackProvider: "openai" }, { dryRun: false });
    await exportSafeConfiguration(source, "configuration.json", { dryRun: false });
    const serialized = await readFile(path.join(source, "configuration.json"), "utf8");
    assert.doesNotMatch(serialized, /sk-|ciphertext|password/i);
    await writeFile(path.join(destination, "configuration.json"), serialized);
    assert.equal((await importSafeConfiguration(destination, "configuration.json", { dryRun: false })).imported, true);
  } finally { await rm(source, { recursive: true, force: true }); await rm(destination, { recursive: true, force: true }); }
});

test("configuration import rejects secret-bearing fields", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "config-unsafe-"));
  try {
    await writeFile(path.join(root, "unsafe.json"), JSON.stringify({ schemaVersion: 1, containsSecrets: false, providerConfiguration: {}, apiKey: "secret" }));
    await assert.rejects(() => importSafeConfiguration(root, "unsafe.json", { dryRun: false }), /Unsafe configuration field/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
