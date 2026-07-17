import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { releaseChecksum, verifyReleasePackage } from "../src/release.js";

test("release package uses an explicit cross-platform allowlist", async () => {
  const result = await verifyReleasePackage(process.cwd());
  assert.equal(result.valid, true, result.issues.join("\n"));
  assert.deepEqual(result.operatingSystems, ["darwin", "linux", "win32"]);
  assert.ok(result.files.includes("src/"));
});

test("release checksums are deterministic SHA-256 values", async () => {
  const contents = await readFile(new URL("../package.json", import.meta.url));
  assert.match(releaseChecksum(contents), /^[a-f0-9]{64}$/);
  assert.equal(releaseChecksum(contents), releaseChecksum(contents));
});

test("publication metadata derives the current version and canonical repository", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  const generator = await readFile(new URL("../scripts/generate-distribution.js", import.meta.url), "utf8");

  assert.match(workflow, /require\('\.\/package\.json'\)\.version/);
  assert.match(workflow, /type=raw,value=\$\{\{ steps\.package\.outputs\.version \}\}/);
  assert.doesNotMatch(workflow, /type=raw,value=1\.1\.0/);
  assert.match(generator, /https:\/\/github\.com\/rohitkumarnaidu\/Forgevena/);
  assert.doesNotMatch(generator, /rohitkumarnaidu\/Work-Space/);
});
