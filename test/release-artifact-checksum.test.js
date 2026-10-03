import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { verifyReleaseArtifactChecksum } from "../scripts/verify-release-artifact-checksum.js";

test("release artifact checksum verifier accepts a matching checksum manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-checksum-"));
  try {
    const artifact = path.join(root, "forgevena-1.4.0-rc.3.tgz");
    const manifest = path.join(root, "SHA256SUMS");
    const contents = Buffer.from("published package artifact");
    const sha256 = createHash("sha256").update(contents).digest("hex");
    await writeFile(artifact, contents);
    await writeFile(manifest, `${sha256}  ${path.basename(artifact)}\n`);
    assert.deepEqual(await verifyReleaseArtifactChecksum(artifact, manifest), { artifact: path.basename(artifact), sha256, verified: true });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("release artifact checksum verifier rejects missing and incorrect entries", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-checksum-negative-"));
  try {
    const artifact = path.join(root, "forgevena.tgz");
    const manifest = path.join(root, "SHA256SUMS");
    await writeFile(artifact, "content");
    await writeFile(manifest, `${"0".repeat(64)}  another.tgz\n`);
    await assert.rejects(() => verifyReleaseArtifactChecksum(artifact, manifest), /No SHA-256 entry/);
    await writeFile(manifest, `${"0".repeat(64)}  forgevena.tgz\n`);
    await assert.rejects(() => verifyReleaseArtifactChecksum(artifact, manifest), /SHA-256 mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
