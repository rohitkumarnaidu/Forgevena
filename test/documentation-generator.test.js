import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { generateCanonicalDocumentation, verifyCanonicalDocumentation } from "../src/documentation-generator.js";

test("canonical documentation is additive and detects drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-docs-"));
  try {
    assert.equal((await generateCanonicalDocumentation(root, { dryRun: true })).create.length, 5);
    const generated = await generateCanonicalDocumentation(root, { dryRun: false });
    assert.equal(generated.created.length, 5);
    assert.equal((await verifyCanonicalDocumentation(root)).valid, true);
    assert.equal((await generateCanonicalDocumentation(root, { dryRun: false })).skipped.length, 5);
    const cliPath = path.join(root, "docs/reference/generated/cli.md");
    await writeFile(cliPath, (await readFile(cliPath, "utf8")).replace(/\n/g, "\r\n"));
    assert.equal((await verifyCanonicalDocumentation(root)).valid, true);
    await writeFile(cliPath, "drift\n");
    const drift = await verifyCanonicalDocumentation(root);
    assert.equal(drift.valid, false);
    assert.match(drift.issues[0], /differs/);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
