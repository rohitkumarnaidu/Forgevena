import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { initializeProject, rollbackProject } from "../src/project.js";
import { moduleContract } from "../src/modules.js";
import { initializeIntegrationProject, manageIntegration, recordIntegration } from "../src/integrations.js";
import { validateDockerAssets } from "../src/docker.js";

const execute = promisify(execFile);
const cli = path.resolve("bin", "ai-workspace.js");

test("CLI previews external install and reference actions without side effects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-preview-"));
  try {
    const install = JSON.parse((await execute("node", [cli, "install", "openspec"], { cwd: root })).stdout);
    const reference = JSON.parse((await execute("node", [cli, "reference", "design-md"], { cwd: root })).stdout);
    assert.equal(install.dryRun, true);
    assert.equal(install.approval.reason, "preview");
    assert.equal(reference.dryRun, true);
    assert.equal(reference.approval.reason, "preview");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("verbose CLI output includes execution diagnostics", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-verbose-"));
  try {
    const output = JSON.parse((await execute("node", [cli, "templates", "--verbose"], { cwd: root })).stdout);
    assert.ok(output.result.templates.includes("flutter"));
    assert.equal(output.diagnostics.dryRun, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("integration lifecycle persists project state and generated guidance", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "integration-lifecycle-"));
  try {
    await initializeProject(root, { dryRun: false });
    assert.equal((await recordIntegration(root, "openspec", { dryRun: false })).registered, true);
    assert.ok((await initializeIntegrationProject(root, "openspec", { dryRun: false })).created.includes("docs/integrations/openspec.md"));
    assert.equal((await manageIntegration(root, "validate", "openspec", { dryRun: false })).registryUpdated, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("module lifecycle validation reports missing module assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "module-lifecycle-"));
  try {
    const result = await moduleContract("design").validate(root);
    assert.equal(result.valid, false);
    assert.ok(result.missing.includes("DESIGN.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rollback requires latest operation order", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rollback-order-"));
  try {
    const first = await initializeProject(root, { dryRun: false });
    const second = await initializeProject(root, { dryRun: false });
    await assert.rejects(() => rollbackProject(root, first.transaction, { dryRun: true }), /latest managed operation/);
    assert.equal((await rollbackProject(root, second.transaction, { dryRun: true })).operation, second.transaction);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Docker validation recognizes production Compose assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "docker-validation-"));
  const project = path.join(root, "app");
  try {
    await initializeProject(project, { dryRun: false, createProject: true, template: "fastapi" });
    const validation = await validateDockerAssets(project, "fastapi");
    assert.equal(validation.valid, true);
    assert.equal(validation.composePath, "docker-compose.production.yml");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Phase 5 CLI commands preserve preview and additive defaults", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "phase5-cli-"));
  try {
    await initializeProject(root, { dryRun: false, createProject: true, projectName: "phase5", template: "fastapi" });
    const provider = JSON.parse((await execute("node", [cli, "providers", "invoke", "openai", "--prompt", "hello"], { cwd: root })).stdout);
    assert.equal(provider.dryRun, true);
    assert.equal(provider.promptLogged, false);
    const mcp = JSON.parse((await execute("node", [cli, "mcp", "add", "local", "--transport", "http", "--url", "http://127.0.0.1:9999/mcp", "--apply"], { cwd: root })).stdout);
    assert.equal(mcp.created, true);
    const plugins = JSON.parse((await execute("node", [cli, "plugins", "list"], { cwd: root })).stdout);
    assert.deepEqual(plugins.plugins, []);
    const render = JSON.parse((await execute("node", [cli, "cloud", "render", "generate", "--apply"], { cwd: root })).stdout);
    assert.equal(render.blueprintGenerated, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("plugin publisher trust is additive and preview-first", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-trust-cli-"));
  try {
    const { publicKey } = generateKeyPairSync("ed25519");
    await writeFile(path.join(root, "publisher.pem"), publicKey.export({ type: "spki", format: "pem" }));
    const preview = await execute("node", [cli, "plugins", "trust", "example", "--public-key-file", "publisher.pem"], { cwd: root });
    assert.equal(JSON.parse(preview.stdout).dryRun, true);
    await execute("node", [cli, "plugins", "trust", "example", "--public-key-file", "publisher.pem", "--apply"], { cwd: root });
    const trust = await readFile(path.join(root, ".ai-workspace", "plugins", "trusted-publishers.json"), "utf8");
    assert.match(trust, /example/);
    assert.doesNotMatch(trust, /PRIVATE KEY/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
