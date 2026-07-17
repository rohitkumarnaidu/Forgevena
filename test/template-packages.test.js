import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { exportBuiltInTemplatePackage, loadTemplatePackage, validateTemplateManifest, verifyTemplatePackage } from "../src/template-packages.js";

test("template packages validate assets and inheritance", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-template-"));
  try {
    await mkdir(path.join(root, "base"));
    await writeFile(path.join(root, "base", "README.md"), "base\n");
    await writeFile(path.join(root, "base", "template.json"), JSON.stringify({ schemaVersion: 1, id: "base", version: "1.0.0", assets: [{ source: "README.md", target: "README.md" }] }));
    await mkdir(path.join(root, "child"));
    await writeFile(path.join(root, "child", "app.js"), "console.log('ok');\n");
    await writeFile(path.join(root, "child", "template.json"), JSON.stringify({ schemaVersion: 1, id: "child", version: "1.0.0", extends: "../base/template.json", assets: [{ source: "app.js", target: "src/app.js" }] }));
    const loaded = await loadTemplatePackage(path.join(root, "child", "template.json"));
    assert.deepEqual(loaded.assets.map(({ path: target }) => target), ["README.md", "src/app.js"]);
    assert.deepEqual(loaded.inheritedFrom, ["base"]);
    assert.equal((await verifyTemplatePackage(path.join(root, "child", "template.json"))).valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("template packages reject path escape and duplicate targets", () => {
  assert.throws(() => validateTemplateManifest({ schemaVersion: 1, id: "bad", version: "1.0.0", assets: [{ source: "../secret", target: "safe" }] }, "."), /inside the package/);
  assert.throws(() => validateTemplateManifest({ schemaVersion: 1, id: "bad", version: "1.0.0", assets: [{ source: "a", target: "same" }, { source: "b", target: "same" }] }, "."), /unique/);
});

test("built-in templates export additively into verifiable packages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-template-export-"));
  try {
    const preview = await exportBuiltInTemplatePackage(root, "react", { dryRun: true });
    assert.equal(preview.create.includes("template.json"), true);
    const exported = await exportBuiltInTemplatePackage(root, "react", { dryRun: false });
    assert.equal((await verifyTemplatePackage(exported.manifest)).valid, true);
    const second = await exportBuiltInTemplatePackage(root, "react", { dryRun: false });
    assert.equal(second.created.length, 0);
    assert.equal(second.skipped.length, preview.create.length);
  } finally { await rm(root, { recursive: true, force: true }); }
});
