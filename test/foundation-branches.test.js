import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { approveExternalAction } from "../src/consent.js";
import { exportSafeConfiguration, importSafeConfiguration } from "../src/config-transfer.js";
import { loadConfig, setConfig } from "../src/config.js";
import { addReference, listReferences } from "../src/references.js";
import { releaseChecksum, verifyReleasePackage } from "../src/release.js";
import { initializeProject } from "../src/project.js";
import { installTool, listToolPlans } from "../src/tool-adapters.js";
import { rollbackUpgrade, upgradeWorkspace } from "../src/upgrade.js";
import { PLATFORM_VERSION } from "../src/version.js";
import { FileStateEngine } from "../src/state-engine.js";

test("consent remains preview-first and requires explicit non-interactive approval", async () => {
  const plan = { command: "external command" };
  assert.equal((await approveExternalAction(plan)).reason, "preview");
  assert.equal((await approveExternalAction(plan, { dryRun: false, apply: false })).reason, "preview");
  assert.equal((await approveExternalAction(plan, { dryRun: false, apply: true, yes: true })).reason, "explicit-yes");
  await assert.rejects(() => approveExternalAction(plan, { dryRun: false, apply: true, nonInteractive: true }), /require --yes/);
});

test("configuration parsing and persistence cover every supported scalar type", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "config-branches-"));
  try {
    assert.equal((await loadConfig(root)).confirmApply, true);
    assert.equal((await setConfig(root, "confirmApply", "false")).next.confirmApply, false);
    assert.equal((await setConfig(root, "logRetentionDays", "45", { dryRun: false })).config.logRetentionDays, 45);
    assert.equal((await setConfig(root, "output", "structured", { dryRun: false })).config.output, "structured");
    assert.equal((await loadConfig(root)).output, "structured");
    await assert.rejects(() => setConfig(root, "unknown", "value"), /Unsupported configuration key/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("safe configuration transfer rejects escapes, invalid bundles, and existing targets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "config-transfer-branches-"));
  try {
    await assert.rejects(() => exportSafeConfiguration(root, "../outside.json"), /remain inside/);
    await assert.rejects(() => importSafeConfiguration(root), /--input/);
    await assert.rejects(() => importSafeConfiguration(root, "../outside.json"), /remain inside/);

    const exportPath = path.join("exports", "safe.json");
    assert.equal((await exportSafeConfiguration(root, exportPath)).create[0], exportPath);
    assert.equal((await exportSafeConfiguration(root, exportPath, { dryRun: false })).exported, true);
    assert.equal((await exportSafeConfiguration(root, exportPath, { dryRun: false })).skipped[0], exportPath);

    await writeFile(path.join(root, "invalid.json"), JSON.stringify({ schemaVersion: 2, containsSecrets: false, providerConfiguration: {} }));
    await assert.rejects(() => importSafeConfiguration(root, "invalid.json"), /Unsupported or unsafe/);
    await writeFile(path.join(root, "primitive.json"), JSON.stringify({ schemaVersion: 1, containsSecrets: false, providerConfiguration: { primary: null }, metadata: "safe" }));
    const preview = await importSafeConfiguration(root, "primitive.json");
    assert.equal(preview.importsCredentials, false);
    const imported = await importSafeConfiguration(root, "primitive.json", { dryRun: false });
    assert.equal(imported.importsCredentials, false);
    assert.equal((await importSafeConfiguration(root, "primitive.json", { dryRun: false })).skipped.length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("release verification reports every invalid allowlist and metadata condition", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "release-branches-"));
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "invalid", version: "0.0.0", private: true, files: [".env", "node_modules/"] }));
    const result = await verifyReleasePackage(root);
    assert.equal(result.valid, false);
    assert.equal(result.issues.some((issue) => issue.includes("must not be private")), true);
    assert.equal(result.issues.some((issue) => issue.includes("legacy ai-workspace")), true);
    assert.equal(result.issues.some((issue) => issue.includes("Forbidden package path")), true);
    assert.equal(result.node, null);
    assert.deepEqual(result.operatingSystems, ["darwin", "linux", "win32"]);
    assert.equal(releaseChecksum("same"), releaseChecksum(Buffer.from("same")));

    const empty = await verifyReleasePackage(root, { packageFiles: [] });
    assert.equal(empty.issues.includes("Explicit package files are required."), true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("reference and tool plans reject unknown names and preserve manual workflows", async () => {
  assert.equal(listReferences().length >= 4, true);
  assert.equal(listToolPlans().some(({ name }) => name === "openspec"), true);
  await assert.rejects(() => addReference("unknown"), /Choose one of/);
  await assert.rejects(() => installTool("unknown"), /Choose one of/);
  assert.equal((await installTool("gstack", { dryRun: false })).manual, true);
  assert.equal((await installTool("openspec")).dryRun, true);

  const previous = process.cwd();
  const root = await mkdtemp(path.join(tmpdir(), "reference-existing-"));
  try {
    process.chdir(root);
    await mkdir(path.join(root, "reference", "design-md"), { recursive: true });
    const result = await addReference("design-md", { dryRun: false });
    assert.equal(result.alreadyPresent, true);
    assert.equal(result.dryRun, false);
  } finally {
    process.chdir(previous);
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace upgrades handle missing, current, future, consent, and rollback states", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "upgrade-branches-"));
  try {
    await assert.rejects(() => upgradeWorkspace(root), /Initialize the project/);
    await initializeProject(root, { dryRun: false });
    const current = await upgradeWorkspace(root);
    assert.equal(current.to.version, PLATFORM_VERSION);

    const state = new FileStateEngine(root);
    const registry = await state.read(".ai-workspace/workspace.json");
    registry.schemaVersion = 999;
    await state.write(".ai-workspace/workspace.json", registry);
    await assert.rejects(() => upgradeWorkspace(root), /newer than supported/);

    registry.schemaVersion = 1;
    registry.workspaceVersion = "1.1.0";
    await state.write(".ai-workspace/workspace.json", registry);
    const applied = await upgradeWorkspace(root, { dryRun: false });
    assert.equal(applied.applied, true);
    assert.equal((await rollbackUpgrade(root)).applied, false);
    await assert.rejects(() => rollbackUpgrade(root, { dryRun: false }), /--apply --yes/);
    assert.equal((await rollbackUpgrade(root, { dryRun: false, yes: true })).applied, true);
  } finally { await rm(root, { recursive: true, force: true }); }

  const missing = await mkdtemp(path.join(tmpdir(), "upgrade-missing-state-"));
  try { await assert.rejects(() => rollbackUpgrade(missing), /No upgrade state/); }
  finally { await rm(missing, { recursive: true, force: true }); }
});
