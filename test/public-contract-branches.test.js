import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CAPABILITY_MATURITY, listCapabilities, resolveCapability } from "../src/capabilities.js";
import { moduleContract, supportedModules } from "../src/modules.js";
import { configureProjectProviders, readProjectProviderConfig } from "../src/provider-project.js";
import { providerPolicyExists, readProviderPolicy, recordProviderUsage, setProviderPolicy } from "../src/provider-policy.js";

async function workspace() { return mkdtemp(path.join(os.tmpdir(), "forgevena-contract-")); }

test("capability resolution covers defaults, alternatives, and validation", () => {
  assert.ok(listCapabilities().length >= 7);
  assert.deepEqual(CAPABILITY_MATURITY, ["experimental", "preview", "stable", "enterprise-certified", "deprecated"]);
  for (const capability of listCapabilities()) {
    assert.ok(CAPABILITY_MATURITY.includes(capability.maturity));
    assert.equal(capability.support, "community");
    assert.match(capability.evidence, /^docs\//);
  }
  assert.equal(resolveCapability("design-system").integration, "design-md");
  assert.equal(resolveCapability("design-system").maturity, "preview");
  assert.deepEqual(resolveCapability("design-system", "astryx").alternatives, ["design-md"]);
  assert.throws(() => resolveCapability("missing"), /Unknown capability/);
  assert.throws(() => resolveCapability("design-system", "openspec"), /does not implement/);
});

test("module lifecycle reports missing, present, rootless, and unsupported states", async () => {
  const root = await workspace();
  try {
    assert.throws(() => moduleContract("missing"), /Unsupported module/);
    const contract = moduleContract("core");
    assert.equal((await contract.status()).initialized, false);
    const absent = await contract.validate(root);
    assert.equal(absent.valid, false);
    for (const asset of contract.initialize()) {
      const target = path.join(root, asset.relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, asset.contents);
    }
    assert.equal((await contract.validate(root)).valid, true);
    assert.equal((await contract.status(root)).initialized, true);
    assert.equal(contract.remove().supported, false);
    assert.equal(contract.rollback().supported, true);
    assert.ok(supportedModules().includes("core"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider policy validates every numeric boundary and usage period", async () => {
  const root = await workspace();
  try {
    assert.equal(await providerPolicyExists(root), false);
    const defaults = await readProviderPolicy(root, "openai");
    assert.equal(defaults.mode, "guarded");
    assert.equal(defaults.usage.requests, 0);
    await assert.rejects(() => setProviderPolicy(root, "openai", { mode: "invalid" }), /Policy mode/);
    for (const field of ["maxInputCharacters", "maxOutputTokens", "timeoutMs", "monthlyRequestLimit"]) {
      await assert.rejects(() => setProviderPolicy(root, "openai", { [field]: 0 }), new RegExp(field));
    }
    await assert.rejects(() => setProviderPolicy(root, "openai", { retries: -1 }), /retries/);
    await assert.rejects(() => setProviderPolicy(root, "openai", { retries: 6 }), /retries/);
    const preview = await setProviderPolicy(root, "openai", { mode: "budgeted", retries: "3", maxInputCharacters: "100" });
    assert.equal(preview.dryRun, true);
    assert.equal(preview.policy.retries, 3);
    assert.equal((await setProviderPolicy(root, "openai", { mode: "budgeted" }, { dryRun: false })).dryRun, false);
    assert.equal(await providerPolicyExists(root), true);
    await recordProviderUsage(root, "openai", { inputCharacters: 10, outputCharacters: 5 });
    const recorded = await readProviderPolicy(root, "openai");
    assert.equal(recorded.usage.requests, 1);
    assert.equal(recorded.usage.inputCharacters, 10);
    assert.equal(recorded.usage.outputCharacters, 5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("project provider configuration validates optional and numeric branches", async () => {
  const root = await workspace();
  try {
    const defaults = await readProjectProviderConfig(root);
    assert.equal(defaults.defaultProvider, "openai");
    assert.equal((await configureProjectProviders(root, { fallbackProvider: undefined })).next.fallbackProvider, null);
    await assert.rejects(() => configureProjectProviders(root, { defaultProvider: "missing" }), /Choose one of/);
    for (const temperature of [-0.1, 2.1]) await assert.rejects(() => configureProjectProviders(root, { temperature }), /Temperature/);
    await assert.rejects(() => configureProjectProviders(root, { maxOutputTokens: 0 }), /positive limits/);
    await assert.rejects(() => configureProjectProviders(root, { retries: -1 }), /positive limits/);
    await assert.rejects(() => configureProjectProviders(root, { timeoutMs: 0 }), /positive limits/);
    const applied = await configureProjectProviders(root, { defaultProvider: "ollama", fallbackProvider: "openai", embeddingProvider: "gemini", priority: ["ollama", "openai"] }, { dryRun: false });
    assert.equal(applied.configured, true);
    assert.equal((await readProjectProviderConfig(root)).defaultProvider, "ollama");
  } finally { await rm(root, { recursive: true, force: true }); }
});
