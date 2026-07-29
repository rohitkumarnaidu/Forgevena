import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { generateCanonicalDocumentation, verifyCanonicalDocumentation } from "../src/documentation-generator.js";

test("canonical documentation is additive and detects drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-docs-"));
  try {
    assert.equal((await generateCanonicalDocumentation(root, { dryRun: true })).create.length, 15);
    const generated = await generateCanonicalDocumentation(root, { dryRun: false });
    assert.equal(generated.created.length, 15);
    assert.equal((await verifyCanonicalDocumentation(root)).valid, true);
    assert.equal((await generateCanonicalDocumentation(root, { dryRun: false })).skipped.length, 15);
    const cliPath = path.join(root, "docs/reference/generated/cli.md");
    await writeFile(cliPath, (await readFile(cliPath, "utf8")).replace(/\n/g, "\r\n"));
    assert.equal((await verifyCanonicalDocumentation(root)).valid, true);
    await writeFile(cliPath, "drift\n");
    const drift = await verifyCanonicalDocumentation(root);
    assert.equal(drift.valid, false);
    assert.match(drift.issues[0], /differs/);
    const conflict = await generateCanonicalDocumentation(root, { dryRun: false });
    assert.ok(conflict.conflicts.some(({ name }) => name === "cli.md"));
    assert.equal(await readFile(cliPath, "utf8"), "drift\n");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("canonical documentation updates only manifest-owned generated files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-docs-managed-"));
  try {
    await generateCanonicalDocumentation(root, { dryRun: false });
    const output = path.join(root, "docs/reference/generated");
    const cliPath = path.join(output, "cli.md");
    const manifestPath = path.join(output, "manifest.json");
    const stale = "# Stale generated CLI\n";
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.files["cli.md"] = createHash("sha256").update(stale).digest("hex");
    await writeFile(cliPath, stale);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const preview = await generateCanonicalDocumentation(root, { dryRun: true });
    assert.deepEqual(preview.update.sort(), ["cli.md", "manifest.json"]);
    const generated = await generateCanonicalDocumentation(root, { dryRun: false });
    assert.deepEqual(generated.updated.sort(), ["cli.md", "manifest.json"]);
    assert.equal((await verifyCanonicalDocumentation(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
