import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { exportSafeConfiguration, importSafeConfiguration } from "../src/config-transfer.js";
import { configureProjectProviders, readProjectProviderConfig } from "../src/provider-project.js";

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
    assert.deepEqual(await readProjectProviderConfig(destination), await readProjectProviderConfig(source));
    assert.equal((await importSafeConfiguration(destination, "configuration.json")).importsCredentials, false);
    await assert.rejects(() => readFile(path.join(destination, ".credentials", "openai.enc.json")));
    await assert.rejects(() => readFile(path.join(destination, ".ai-workspace", "local-secrets", "openai.env")));
  } finally { await rm(source, { recursive: true, force: true }); await rm(destination, { recursive: true, force: true }); }
});

test("configuration import skips and preserves an existing destination project configuration", async () => {
  const source = await mkdtemp(path.join(tmpdir(), "config-export-collision-source-"));
  const destination = await mkdtemp(path.join(tmpdir(), "config-import-collision-destination-"));
  try {
    await configureProjectProviders(source, { defaultProvider: "ollama", fallbackProvider: "openai" }, { dryRun: false });
    await exportSafeConfiguration(source, "configuration.json", { dryRun: false });
    await writeFile(path.join(destination, "configuration.json"), await readFile(path.join(source, "configuration.json")));
    await configureProjectProviders(destination, { defaultProvider: "gemini" }, { dryRun: false });
    const projectPath = path.join(destination, ".ai-workspace", "providers", "project.json");
    const before = await readFile(projectPath, "utf8");
    const result = await importSafeConfiguration(destination, "configuration.json", { dryRun: false });
    assert.deepEqual(result.skipped, [path.relative(destination, projectPath)]);
    assert.equal(result.imported, undefined);
    assert.equal(await readFile(projectPath, "utf8"), before);
  } finally { await rm(source, { recursive: true, force: true }); await rm(destination, { recursive: true, force: true }); }
});

test("configuration import rejects secret-bearing fields", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "config-unsafe-"));
  try {
    await writeFile(path.join(root, "unsafe.json"), JSON.stringify({ schemaVersion: 1, containsSecrets: false, providerConfiguration: {}, apiKey: "secret" }));
    await assert.rejects(() => importSafeConfiguration(root, "unsafe.json", { dryRun: false }), /Unsafe configuration field/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
