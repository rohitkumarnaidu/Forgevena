import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { generateKeyPairSync, sign } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { executeMcpHealth, listMcpServers, mcpHealthPlan, registerMcpServer, setMcpActivation, validateMcpServer } from "../src/mcp.js";
import { installPlugin, listPlugins, pluginHealth, setPluginEnabled, trustPluginPublisher, updatePlugin, validatePlugin } from "../src/plugins.js";

test("custom MCP servers are registered disabled and activated additively", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mcp-registry-"));
  try {
    const created = await registerMcpServer(root, { name: "example", transport: "http", url: "https://mcp.example.test/mcp", headerEnvironment: { Authorization: "EXAMPLE_MCP_AUTH" } }, { dryRun: false });
    assert.equal(created.created, true);
    assert.equal((await listMcpServers(root))[0].enabled, false);
    assert.deepEqual((await validateMcpServer(root, "example")).missingEnvironment, ["EXAMPLE_MCP_AUTH"]);
    const activated = await setMcpActivation(root, "example", true, "cursor", { dryRun: false });
    assert.equal(activated.generated.created, true);
    const generated = await readFile(path.join(root, ".ai-workspace", "mcp", "generated", "cursor-example.json"), "utf8");
    assert.match(generated, /\$\{EXAMPLE_MCP_AUTH\}/);
    const duplicate = await registerMcpServer(root, { name: "example", transport: "stdio", command: "other" }, { dryRun: false });
    assert.equal(duplicate.skipped, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("remote MCP health uses environment references without persisting values", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mcp-health-"));
  const previous = process.env.EXAMPLE_MCP_AUTH;
  process.env.EXAMPLE_MCP_AUTH = "Bearer local-secret";
  try {
    await registerMcpServer(root, { name: "remote", transport: "http", url: "https://mcp.example.test/mcp", headerEnvironment: { Authorization: "EXAMPLE_MCP_AUTH" } }, { dryRun: false });
    const plan = await mcpHealthPlan(root, "remote");
    let authorization;
    const result = await executeMcpHealth(plan, { fetchImpl: async (_url, options) => { authorization = options.headers.Authorization; return new Response("{}", { status: 200 }); } });
    assert.equal(result.healthy, true);
    assert.equal(authorization, "Bearer local-secret");
    assert.doesNotMatch(await readFile(path.join(root, ".ai-workspace", "mcp", "servers.json"), "utf8"), /local-secret/);
  } finally {
    if (previous === undefined) delete process.env.EXAMPLE_MCP_AUTH; else process.env.EXAMPLE_MCP_AUTH = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("remote MCP health retries transient failures", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mcp-retry-"));
  let calls = 0;
  try {
    await registerMcpServer(root, { name: "retry", transport: "http", url: "https://mcp.example.test/mcp" }, { dryRun: false });
    const plan = await mcpHealthPlan(root, "retry");
    const result = await executeMcpHealth(plan, { fetchImpl: async () => { calls += 1; return new Response("{}", { status: calls < 3 ? 503 : 200 }); } });
    assert.equal(result.healthy, true);
    assert.equal(result.attempts, 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("declarative plugins are integrity locked and never executable", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-registry-"));
  const manifestPath = path.join(root, "plugin.json");
  try {
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, id: "example-plugin", version: "1.0.0", type: "declarative", permissions: ["mcp-definition"], contributions: { mcpServers: ["example"] } }));
    const installed = await installPlugin(root, manifestPath, { dryRun: false });
    assert.equal(installed.executableCode, false);
    assert.equal((await listPlugins(root))[0].enabled, false);
    assert.equal((await validatePlugin(root, "example-plugin")).valid, true);
    assert.equal((await setPluginEnabled(root, "example-plugin", true, { dryRun: false })).enabled, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("executable plugin manifests are rejected", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-reject-"));
  const manifestPath = path.join(root, "plugin.json");
  try {
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, id: "unsafe", version: "1.0.0", type: "executable" }));
    await assert.rejects(() => installPlugin(root, manifestPath, { dryRun: false }), /declarative plugins only/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("MCP definitions reject inline credentials", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mcp-inline-secret-"));
  try {
    await assert.rejects(() => registerMcpServer(root, { name: "unsafe", transport: "http", url: "https://example.test/mcp?api_key=secret" }, { dryRun: false }), /must not contain inline credentials/);
    await assert.rejects(() => registerMcpServer(root, { name: "unsafe-stdio", transport: "stdio", command: "server", args: ["--api-key=secret"] }, { dryRun: false }), /must not contain inline credentials/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("remote plugins require an Ed25519 signature from a trusted publisher", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-signature-"));
  try {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
    await trustPluginPublisher(root, "example", publicKeyPem, { dryRun: false });
    const unsigned = { schemaVersion: 1, id: "signed-plugin", version: "1.0.0", type: "declarative", platform: ">=0.2.0", permissions: ["documentation"], contributions: { documents: ["guide"] } };
    const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
    const signature = sign(null, Buffer.from(JSON.stringify(sort(unsigned))), privateKey).toString("base64");
    const manifest = { ...unsigned, signature: { publisher: "example", algorithm: "ed25519", value: signature } };
    const result = await installPlugin(root, "https://plugins.example.test/signed.json", { dryRun: false, fetchImpl: async () => new Response(JSON.stringify(manifest), { status: 200 }) });
    assert.equal(result.signature.trusted, true);
    assert.equal((await validatePlugin(root, "signed-plugin")).signature.trusted, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("plugin updates preserve prior versions and expose health", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-update-"));
  const manifestPath = path.join(root, "plugin.json");
  try {
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, id: "updatable", version: "1.0.0", type: "declarative", permissions: [] }));
    await installPlugin(root, manifestPath, { dryRun: false });
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, id: "updatable", version: "1.1.0", type: "declarative", permissions: ["documentation"] }));
    const updated = await updatePlugin(root, manifestPath, { dryRun: false });
    assert.equal(updated.updated, true);
    assert.equal((await listPlugins(root))[0].previousVersions[0], "1.0.0");
    assert.equal((await pluginHealth(root, "updatable")).healthy, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
