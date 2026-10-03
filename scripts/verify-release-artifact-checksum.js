import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function verifyReleaseArtifactChecksum(artifactPath, checksumsPath) {
  const artifactName = path.basename(artifactPath);
  const checksums = await readFile(checksumsPath, "utf8");
  const expectedLine = checksums.split(/\r?\n/).find((line) => {
    const match = line.match(/^([a-f\d]{64})\s+\*?(.+)$/i);
    return match?.[2] === artifactName;
  });
  if (!expectedLine) throw new Error(`No SHA-256 entry found for ${artifactName}.`);
  const expected = expectedLine.match(/^([a-f\d]{64})/i)[1].toLowerCase();
  const actual = createHash("sha256").update(await readFile(artifactPath)).digest("hex");
  if (actual !== expected) throw new Error(`SHA-256 mismatch for ${artifactName}.`);
  return { artifact: artifactName, sha256: actual, verified: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [artifactPath, checksumsPath] = process.argv.slice(2);
  if (!artifactPath || !checksumsPath) {
    console.error("Usage: node scripts/verify-release-artifact-checksum.js <artifact> <checksums>");
    process.exitCode = 2;
  } else {
    try { console.log(JSON.stringify(await verifyReleaseArtifactChecksum(artifactPath, checksumsPath))); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
