import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createCompatibilityEvidence, evidenceFreshness, profileFromDefinition, ProviderRegistry, ProviderRegistryError } from "../src/provider-registry.js";
import { ProviderService } from "../src/provider-service.js";

test("provider registry stores reference-only profiles and compatibility evidence", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-registry-"));
  try {
    const registry = new ProviderRegistry(root, { clock: () => new Date("2026-08-01T00:00:00.000Z") });
    await registry.registerProfile(profileFromDefinition("claude"));
    const evidence = createCompatibilityEvidence("claude", { id: "claude-fixture", verifiedAt: new Date("2026-08-01T00:00:00.000Z"), models: ["fixture"], fixtureHashes: ["a".repeat(64)] });
    await registry.recordCompatibility(evidence);
    const stored = await registry.read();
    assert.equal(stored.profiles.claude.service, "Anthropic");
    assert.equal(stored.profiles.claude.storesSecrets, false);
    assert.equal((await registry.compatibility("claude", { requireCurrent: true })).freshness, "current");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("compatibility freshness expires and fails closed when required", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-freshness-"));
  try {
    const registry = new ProviderRegistry(root, { clock: () => new Date("2027-01-01T00:00:00.000Z") });
    const evidence = createCompatibilityEvidence("openai", { id: "old", verifiedAt: new Date("2026-01-01T00:00:00.000Z"), fixtureHashes: [] });
    await registry.recordCompatibility(evidence);
    assert.equal(evidenceFreshness(evidence, new Date("2027-01-01T00:00:00.000Z")), "stale");
    await assert.rejects(() => registry.compatibility("openai", { requireCurrent: true }), (error) => error instanceof ProviderRegistryError && error.code === "compatibility_stale");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider registry migration preserves unknown providers and previews by default", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-migration-"));
  try {
    const registry = new ProviderRegistry(root);
    const preview = await registry.migrate({ legacyWorkspace: { providerProfiles: ["openai", "future-provider"] } });
    assert.deepEqual(preview.additions.map((entry) => entry.provider), ["openai"]);
    assert.deepEqual(preview.preservedUnknownProviders, ["future-provider"]);
    assert.deepEqual((await registry.read()).profiles, {});
    const applied = await registry.migrate({ legacyWorkspace: { providerProfiles: ["openai"] }, dryRun: false, operationId: "provider-migration" });
    assert.deepEqual(applied.migrated, ["openai"]);
    assert.equal((await registry.read()).profiles.openai.provider, "openai");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider service discovers legacy workspace profiles for migration", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-service-migration-"));
  try {
    await mkdir(path.join(root, ".ai-workspace", "providers"), { recursive: true });
    await writeFile(path.join(root, ".ai-workspace", "workspace.json"), JSON.stringify({ providerProfiles: ["openai"] }));
    await writeFile(path.join(root, ".ai-workspace", "providers", "openai.json"), JSON.stringify(profileFromDefinition("openai", { allowedModels: ["fixture-model"] })));
    const service = new ProviderService(root);
    const preview = await service.migrateLegacy({ dryRun: true });
    assert.equal(preview.additions[0].provider, "openai");
    assert.deepEqual(preview.additions[0].allowedModels, ["fixture-model"]);
    const applied = await service.migrateLegacy({ dryRun: false });
    assert.deepEqual(applied.migrated, ["openai"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
