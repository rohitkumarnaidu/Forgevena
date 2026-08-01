import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { cloudCommand, mcpCommand, pluginCommand, providerCommand } from "../src/cli/handlers/ecosystem.js";
import { writeStateDocument } from "../src/state-documents.js";

async function workspace(prefix, callback) {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  try { return await callback(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("provider handler covers safe lifecycle and stable validation errors", () => workspace("provider-handler-", async (root) => {
  assert.ok((await providerCommand(root, ["list"], { dryRun: true })).providers.length);
  assert.equal((await providerCommand(root, ["configure", "openai"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => providerCommand(root, ["configure", "openai"], { dryRun: false, nonInteractive: true }), { code: "CLI_PROVIDER_INTERACTIVE_REQUIRED" });
  const configured = await providerCommand(root, ["configure", "openai"], { dryRun: false }, { promptSecret: async () => "test-secret" });
  assert.equal(configured.configured, true);
  assert.equal(configured.secret, undefined);
  assert.equal((await providerCommand(root, ["status", "openai"], { dryRun: true }))[0].provider, "openai");
  assert.equal((await providerCommand(root, ["project"], { dryRun: true })).defaultProvider, "openai");
  assert.equal((await providerCommand(root, ["project", "--default", "openai", "--priority", "openai,ollama"], { dryRun: true })).dryRun, true);
  assert.equal((await providerCommand(root, ["limits", "openai"], { dryRun: true })).mode, "guarded");
  assert.equal((await providerCommand(root, ["limits", "openai", "--mode", "guarded"], { dryRun: true })).dryRun, true);
  assert.equal((await providerCommand(root, ["invoke", "openai", "--prompt", "hello"], { dryRun: true })).promptCharacters, 5);
  assert.equal((await providerCommand(root, ["stream", "openai", "--prompt", "hello"], { dryRun: true })).promptCharacters, 5);
  assert.deepEqual(await providerCommand(root, ["cancel", "operation-1"], { dryRun: true }, { providers: { cancel: (operationId) => ({ operationId, cancelled: true }) } }), { operationId: "operation-1", cancelled: true });
  assert.equal((await providerCommand(root, ["test", "openai"], { dryRun: true })).promptLogged, false);
  await assert.rejects(() => providerCommand(root, ["models", "openai"], { dryRun: true }), { code: "CLI_PROVIDER_MODELS_UNSUPPORTED" });
  await assert.rejects(() => providerCommand(root, ["limits"], { dryRun: true }), { code: "CLI_PROVIDER_REQUIRED" });
  await assert.rejects(() => providerCommand(root, ["invoke", "openai"], { dryRun: true }), { code: "CLI_PROVIDER_PROMPT_REQUIRED" });
  await assert.rejects(() => providerCommand(root, ["unknown"], { dryRun: true }), { code: "CLI_PROVIDER_ACTION_INVALID" });
}));

test("MCP handler parses additive definitions and fails closed", () => workspace("mcp-handler-", async (root) => {
  assert.deepEqual((await mcpCommand(root, ["list"], { dryRun: true })).servers, []);
  const plan = await mcpCommand(root, ["add", "docs", "--url", "https://example.com/mcp", "--header-environment-json", "{\"Authorization\":\"TOKEN\"}"], { dryRun: true });
  assert.equal(plan.dryRun, true);
  assert.equal(plan.definition.headerEnvironment.Authorization, "TOKEN");
  const stdio = await mcpCommand(root, ["add", "local", "--transport", "stdio", "--command", "node", "--environment", "TOKEN,REGION"], { dryRun: true });
  assert.deepEqual(stdio.definition.environment, ["TOKEN", "REGION"]);
  await assert.rejects(() => mcpCommand(root, ["add", "docs", "--args-json", "{"], { dryRun: true }), { code: "CLI_JSON_OPTION_INVALID" });
  await assert.rejects(() => mcpCommand(root, ["health"], { dryRun: true }), { code: "CLI_MCP_SERVER_REQUIRED" });
  await assert.rejects(() => mcpCommand(root, ["unknown", "docs"], { dryRun: true }), { code: "CLI_MCP_ACTION_INVALID" });
}));

test("plugin handler keeps installation preview-first", () => workspace("plugin-handler-", async (root) => {
  assert.deepEqual((await pluginCommand(root, ["list"], { dryRun: true })).plugins, []);
  const preview = await pluginCommand(root, ["install", "https://example.com/plugin.json"], { dryRun: true });
  assert.equal(preview.dryRun, true);
  assert.equal(preview.remote, true);
  const update = await pluginCommand(root, ["update", "https://example.com/plugin.json"], { dryRun: true });
  assert.equal(update.action, "update");
  await assert.rejects(() => pluginCommand(root, ["trust", "publisher"], { dryRun: true }), { code: "CLI_PLUGIN_PUBLIC_KEY_REQUIRED" });
  await assert.rejects(() => pluginCommand(root, ["install"], { dryRun: true }), { code: "CLI_PLUGIN_REQUIRED" });
  await assert.rejects(() => pluginCommand(root, ["unknown", "plugin"], { dryRun: true }), { code: "CLI_PLUGIN_ACTION_INVALID" });
}));

test("cloud handler covers every credential and preview boundary", () => workspace("cloud-handler-", async (root) => {
  assert.ok((await cloudCommand(root, ["list"], { dryRun: true })).clouds.length > 1);
  assert.equal((await cloudCommand(root, ["aws", "prepare"], { dryRun: true })).dryRun, true);
  assert.equal((await cloudCommand(root, ["aws", "rollback"], { dryRun: true })).automaticDeletion, false);
  assert.equal((await cloudCommand(root, ["aws", "credentials"], { dryRun: true })).dryRun, true);
  assert.equal((await cloudCommand(root, ["aws", "deploy"], { dryRun: true })).dryRun, true);
  await writeStateDocument(root, ".ai-workspace/workspace.json", { projectName: "test", template: "react", provider: "openai" });
  assert.equal((await cloudCommand(root, ["render", "generate"], { dryRun: true })).dryRun, true);
  assert.equal((await cloudCommand(root, ["render", "credentials"], { dryRun: true })).dryRun, true);
  assert.equal((await cloudCommand(root, ["render", "configure", "--service-ids", "one,two"], { dryRun: true })).dryRun, true);
  assert.equal((await cloudCommand(root, ["render", "rollback"], { dryRun: true })).automaticDeletion, false);
  assert.equal((await cloudCommand(root, ["render", "plan"], { dryRun: true })).dryRun, true);
  await assert.rejects(() => cloudCommand(root, ["aws", "unknown"], { dryRun: true }), { code: "CLI_CLOUD_ACTION_INVALID" });
  await assert.rejects(() => cloudCommand(root, ["render", "unknown"], { dryRun: true }), { code: "CLI_RENDER_ACTION_INVALID" });
}));
