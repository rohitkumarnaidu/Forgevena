import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { approveExternalAction } from "../src/consent.js";
import { initializeProject, rollbackProject } from "../src/project.js";
import { configureProviderCredential, initializeProviderProfile, providerStatus } from "../src/providers.js";
import { installTool } from "../src/tool-adapters.js";

test("external actions remain previews until explicit approval", async () => {
  const plan = await installTool("openspec", { dryRun: true });
  const approval = await approveExternalAction(plan, { dryRun: true });
  assert.equal(approval.approved, false);
  assert.match(plan.dataImpact, /Downloads/);
  await assert.rejects(() => approveExternalAction(plan, { dryRun: false, apply: true, nonInteractive: true }), /require --yes/);
});

test("provider profiles record references and never a secret", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-profile-"));
  try {
    const result = await initializeProviderProfile(root, "openai", { dryRun: false });
    assert.equal(result.storesSecrets, false);
    const profile = await readFile(path.join(root, ".ai-workspace", "providers", "openai.json"), "utf8");
    assert.doesNotMatch(profile, /sk-/);
    assert.equal((await providerStatus(root, "openai"))[0].storesSecrets, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider configuration creates an isolated local secret without returning the key", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-configure-"));
  try {
    const result = await configureProviderCredential(root, "openai", "test-secret-value", { dryRun: false });
    assert.equal(result.configured, true);
    assert.doesNotMatch(JSON.stringify(result), /test-secret-value/);
    const credentialPath = path.join(root, ".ai-workspace", "local-secrets", "openai.env");
    assert.match(await readFile(credentialPath, "utf8"), /^OPENAI_API_KEY=test-secret-value$/m);
    const protectedResult = await configureProviderCredential(root, "openai", "new-secret", { dryRun: false });
    assert.equal(protectedResult.manualRequired, true);
    assert.match(await readFile(credentialPath, "utf8"), /^OPENAI_API_KEY=test-secret-value$/m);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rollback removes only unchanged manifest-owned assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "managed-rollback-"));
  const project = path.join(root, "app");
  try {
    await initializeProject(project, { dryRun: false, createProject: true, template: "blank" });
    await writeFile(path.join(project, "README.md"), "modified by project owner\n");
    const preview = await rollbackProject(project, undefined, { dryRun: true });
    assert.ok(preview.modified.includes("README.md"));
    assert.ok(preview.removable.includes("DESIGN.md"));
    const applied = await rollbackProject(project, undefined, { dryRun: false, yes: true });
    assert.equal(applied.restored, true);
    assert.equal(await readFile(path.join(project, "README.md"), "utf8"), "modified by project owner\n");
  } finally { await rm(root, { recursive: true, force: true }); }
});
