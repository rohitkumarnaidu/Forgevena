import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { diagnosticsCommand, organizationCommand, supplyChainCommand } from "../src/cli/handlers/governance.js";
import { dockerCommand, integrationCommand, referenceCommand, templateCommand, toolCommand } from "../src/cli/handlers/platform.js";
import { writeStateDocument } from "../src/state-documents.js";

async function workspace(prefix, callback) {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  try { return await callback(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("template handler covers catalog previews and usage contracts", () => workspace("template-handler-", async (root) => {
  assert.ok((await templateCommand(root, [], { dryRun: true })).templates.length);
  assert.deepEqual((await templateCommand(root, ["catalogs"], { dryRun: true })).catalogs, []);
  assert.equal((await templateCommand(root, ["fetch", "https://example.com/catalog.json"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => templateCommand(root, ["trust"], { dryRun: true }), { code: "CLI_TEMPLATE_PUBLISHER_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["trust", "publisher"], { dryRun: true }), { code: "CLI_TEMPLATE_PUBLIC_KEY_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["fetch"], { dryRun: true }), { code: "CLI_TEMPLATE_CATALOG_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["verify-cache"], { dryRun: true }), { code: "CLI_TEMPLATE_CATALOG_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["export"], { dryRun: true }), { code: "CLI_TEMPLATE_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["verify"], { dryRun: true }), { code: "CLI_TEMPLATE_MANIFEST_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["test"], { dryRun: true }), { code: "CLI_TEMPLATE_MANIFEST_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["inspect"], { dryRun: true }), { code: "CLI_TEMPLATE_MANIFEST_REQUIRED" });
  await assert.rejects(() => templateCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_TEMPLATE_ACTION_INVALID" });
}));

test("platform handlers preserve preview-first external and Docker behavior", () => workspace("platform-handler-", async (root) => {
  assert.ok((await toolCommand(root, undefined, { dryRun: true })).tools.length);
  assert.ok((await referenceCommand(root, undefined, { dryRun: true })).references.length);
  assert.equal((await toolCommand(root, "openspec", { dryRun: true })).approval.approved, false);
  assert.equal((await referenceCommand(root, "design-md", { dryRun: true })).approval.approved, false);
  await assert.rejects(() => dockerCommand(root, ["plan"], { dryRun: true }), { code: "CLI_DOCKER_PROJECT_REQUIRED" });
  await writeStateDocument(root, ".ai-workspace/workspace.json", { schemaVersion: 2, projectName: "test", template: "react", modules: [] });
  assert.equal((await dockerCommand(root, ["plan"], { dryRun: true })).dryRun, true);
  assert.equal((await dockerCommand(root, ["down"], { dryRun: true })).dryRun, true);
  assert.equal((await dockerCommand(root, ["validate"], { dryRun: true })).valid, false);
  await assert.rejects(() => dockerCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_DOCKER_ACTION_INVALID" });
}));

test("integration handler exposes the complete safe lifecycle", () => workspace("integration-handler-", async (root) => {
  assert.ok((await integrationCommand(root, ["list"], { dryRun: true })).length);
  assert.equal((await integrationCommand(root, ["status", "openspec"], { dryRun: true }))[0].name, "openspec");
  assert.equal((await integrationCommand(root, ["doctor", "openspec"], { dryRun: true }))[0].name, "openspec");
  assert.equal((await integrationCommand(root, ["install", "openspec"], { dryRun: true })).dryRun, true);
  assert.equal((await integrationCommand(root, ["init", "openspec"], { dryRun: true })).dryRun, true);
  assert.equal((await integrationCommand(root, ["install", "openspec"], { dryRun: false })).registered, true);
  for (const action of ["update", "remove", "validate", "health"]) assert.equal((await integrationCommand(root, [action, "openspec"], { dryRun: true })).name, "openspec");
  await assert.rejects(() => integrationCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_INTEGRATION_ACTION_INVALID" });
}));

test("governance handlers expose stable validation and diagnostics contracts", () => workspace("governance-handler-", async (root) => {
  await assert.rejects(() => organizationCommand(root, ["trust"], { dryRun: true }), { code: "CLI_ORG_SIGNER_REQUIRED" });
  await assert.rejects(() => organizationCommand(root, ["trust", "signer"], { dryRun: true }), { code: "CLI_ORG_PUBLIC_KEY_REQUIRED" });
  await assert.rejects(() => organizationCommand(root, ["import"], { dryRun: true }), { code: "CLI_ORG_POLICY_REQUIRED" });
  await assert.rejects(() => organizationCommand(root, ["evaluate"], { dryRun: true }), { code: "CLI_ORG_EVALUATION_INVALID" });
  await assert.rejects(() => organizationCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_ORG_ACTION_INVALID" });
  assert.equal((await diagnosticsCommand(root, ["bundle"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => diagnosticsCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_DIAGNOSTICS_ACTION_INVALID" });
  assert.equal((await supplyChainCommand(root, ["generate"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => supplyChainCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_SUPPLY_CHAIN_ACTION_INVALID" });
}));
