import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateDistribution } from "../scripts/generate-distribution.js";

test("native distribution manifests use immutable standalone release assets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-distribution-"));
  try {
    await mkdir(path.join(root, "dist", "standalone"), { recursive: true });
    await writeFile(path.join(root, "forgevena-9.9.9.tgz"), "npm archive");
    await writeFile(path.join(root, "dist", "standalone", "forgevena-win-x64.exe"), "windows executable");
    await writeFile(path.join(root, "dist", "standalone", "forgevena-linux-x64"), "linux executable");
    await writeFile(path.join(root, "dist", "standalone", "forgevena-macos-x64"), "macos executable");

    await generateDistribution(root, { name: "forgevena", version: "9.9.9" });
    const winget = await readFile(path.join(root, "dist", "winget", "RohitKumarNaidu.Forgevena.yaml"), "utf8");
    const homebrew = await readFile(path.join(root, "dist", "homebrew", "forgevena.rb"), "utf8");
    const install = await readFile(path.join(root, "dist", "chocolatey", "tools", "chocolateyinstall.ps1"), "utf8");
    const uninstall = await readFile(path.join(root, "dist", "chocolatey", "tools", "chocolateyuninstall.ps1"), "utf8");
    const nuspec = await readFile(path.join(root, "dist", "chocolatey", "forgevena.nuspec"), "utf8");
    const manifest = await readFile(path.join(root, "dist", "distribution-manifest.json"), "utf8");

    assert.match(winget, /forgevena-win-x64\.exe/);
    assert.doesNotMatch(winget, /\.tgz/);
    assert.match(homebrew, /forgevena-macos-x64/);
    assert.match(homebrew, /forgevena-linux-x64/);
    assert.match(install, /Get-FileHash/);
    assert.match(install, /ai-workspace\.exe/);
    assert.match(uninstall, /Remove-Item/);
    assert.match(nuspec, /<docsUrl>https:\/\/rohitkumarnaidu\.github\.io\/Forgevena\/<\/docsUrl>/);
    assert.match(nuspec, /<bugTrackerUrl>https:\/\/github\.com\/rohitkumarnaidu\/Forgevena\/issues<\/bugTrackerUrl>/);
    assert.match(nuspec, /<licenseUrl>https:\/\/github\.com\/rohitkumarnaidu\/Forgevena\/blob\/v9\.9\.9\/LICENSE<\/licenseUrl>/);
    assert.doesNotMatch(nuspec, /<license(?:\s|>)/);
    assert.doesNotMatch(nuspec, /nodejs-lts/);
    assert.match(manifest, /"builder"/);

    await generateDistribution(root, { name: "forgevena", version: "9.9.9" });
    assert.equal(await readFile(path.join(root, "dist", "distribution-manifest.json"), "utf8"), manifest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
