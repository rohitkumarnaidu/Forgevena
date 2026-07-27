import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { rollbackUpgrade, upgradeWorkspace } from "../src/upgrade.js";
import { PLATFORM_VERSION, versionInfo } from "../src/version.js";

test("version information is sourced from package metadata", () => {
  assert.equal(versionInfo().version, PLATFORM_VERSION);
  assert.equal(versionInfo().prerelease, null);
});

test("workspace upgrade previews, backs up, migrates, and rolls back", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-upgrade-"));
  try {
    await mkdir(path.join(root, ".ai-workspace"), { recursive: true });
    await writeFile(path.join(root, ".ai-workspace", "workspace.json"), `${JSON.stringify({ initialized: true, schemaVersion: 1, workspaceVersion: "0.1.0", modules: ["core"] }, null, 2)}\n`);
    assert.equal((await upgradeWorkspace(root)).applied, false);
    const applied = await upgradeWorkspace(root, { dryRun: false });
    assert.equal(applied.applied, true);
    const migrated = JSON.parse(await readFile(path.join(root, ".ai-workspace", "workspace.json"), "utf8"));
    assert.equal(migrated.workspaceVersion, PLATFORM_VERSION);
    assert.equal(migrated.schemaVersion, 2);
    assert.equal((await rollbackUpgrade(root)).applied, false);
    assert.equal((await rollbackUpgrade(root, { dryRun: false, yes: true })).applied, true);
    const restored = JSON.parse(await readFile(path.join(root, ".ai-workspace", "workspace.json"), "utf8"));
    assert.equal(restored.workspaceVersion, "0.1.0");
    assert.equal(restored.schemaVersion, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

for (const fixture of ["v1.1", "v1.2"]) {
  test(`workspace upgrade and rollback preserve the ${fixture} published-state fixture`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), `workspace-upgrade-${fixture}-`));
    try {
      const workspaceRoot = path.join(root, ".ai-workspace");
      await mkdir(workspaceRoot, { recursive: true });
      const source = path.resolve("test", "fixtures", "workspaces", fixture, "workspace.json");
      const target = path.join(workspaceRoot, "workspace.json");
      await copyFile(source, target);
      const original = JSON.parse(await readFile(target, "utf8"));

      const preview = await upgradeWorkspace(root);
      assert.equal(preview.from.version, original.workspaceVersion);
      assert.equal(preview.applied, false);

      const applied = await upgradeWorkspace(root, { dryRun: false });
      assert.equal(applied.applied, true);
      const migrated = JSON.parse(await readFile(target, "utf8"));
      assert.equal(migrated.workspaceVersion, PLATFORM_VERSION);
      assert.equal(migrated.schemaVersion, 2);
      assert.deepEqual(migrated.project, original.project);
      assert.deepEqual(migrated.modules, original.modules);

      const rollbackPreview = await rollbackUpgrade(root);
      assert.equal(rollbackPreview.applied, false);
      assert.equal((await rollbackUpgrade(root, { dryRun: false, yes: true })).applied, true);
      assert.deepEqual(JSON.parse(await readFile(target, "utf8")), original);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}
