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
