import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { generateSupplyChainArtifacts, scanRepositorySecrets, verifySupplyChainArtifacts, verifySupplyChainReadiness } from "../src/supply-chain.js";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-supply-chain-"));
  for (const directory of ["bin", ".github/workflows", "docs/security"]) await mkdir(path.join(root, directory), { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "example", version: "1.0.0" }));
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: { "": { name: "example", version: "1.0.0" }, "node_modules/dependency": { name: "dependency", version: "2.0.0", integrity: "sha512-example" } } }));
  await writeFile(path.join(root, "VERSION"), "1.0.0\n");
  await writeFile(path.join(root, "bin/forgevena.js"), "console.log('ok');\n");
  await writeFile(path.join(root, "bin/ai-workspace.js"), "console.log('ok');\n");
  await writeFile(path.join(root, ".github/workflows/security.yml"), "npm audit\ngithub/codeql-action/analyze\n");
  await writeFile(path.join(root, ".github/workflows/release.yml"), "permissions:\n  id-token: write\nrun: npm publish --provenance\n");
  await writeFile(path.join(root, "SECURITY.md"), "# Security\n");
  await writeFile(path.join(root, "docs/security/THREAT_MODEL.md"), "# Threat Model\n");
  return root;
}

test("supply-chain artifacts are deterministic, additive, and verifiable", async () => {
  const root = await fixture();
  try {
    assert.equal((await generateSupplyChainArtifacts(root, { dryRun: true })).create.length, 3);
    const generated = await generateSupplyChainArtifacts(root, { dryRun: false });
    assert.equal(generated.created.length, 3);
    const verification = await verifySupplyChainArtifacts(root);
    assert.equal(verification.valid, true);
    assert.equal(verification.subjects, 5);
    const statement = JSON.parse(await readFile(path.join(root, "dist/supply-chain/provenance.intoto.jsonl"), "utf8"));
    assert.match(statement.predicate.runDetails.builder.id, /\.github\/workflows\/release\.yml$/);
    assert.equal((await generateSupplyChainArtifacts(root, { dryRun: false })).skipped.length, 3);
    assert.equal((await verifySupplyChainReadiness(root)).valid, true);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("secret scanning fails closed on credential-like source", async () => {
  const root = await fixture();
  try {
    const syntheticLeak = ["Bearer", "abcdefghijklmnopqrstuvwxyz"].join(" ");
    await writeFile(path.join(root, "leak.js"), `const value = '${syntheticLeak}';\n`);
    const scan = await scanRepositorySecrets(root);
    assert.equal(scan.valid, false);
    assert.equal(scan.findings[0].type, "bearer-token");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
