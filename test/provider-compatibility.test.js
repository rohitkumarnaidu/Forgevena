import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { verifyProviderCompatibility } from "../src/provider-compatibility.js";

test("provider compatibility evidence verifies fixture integrity without live claims", async () => {
  const result = await verifyProviderCompatibility(process.cwd());
  assert.equal(result.valid, true);
  assert.equal(result.providersChecked, 5);
  assert.equal(result.liveProvidersVerified, 0);
});

test("provider compatibility evidence fails closed on tampering", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-evidence-tamper-"));
  try {
    await mkdir(path.join(root, "providers", "fixtures"), { recursive: true });
    const manifest = JSON.parse(await readFile(path.resolve("providers", "compatibility-evidence.json"), "utf8"));
    await writeFile(path.join(root, "providers", "compatibility-evidence.json"), JSON.stringify(manifest));
    for (const record of manifest.providers) await writeFile(path.join(root, record.fixture), "tampered");
    assert.equal((await verifyProviderCompatibility(root)).valid, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("provider compatibility evidence is independent of checkout line endings", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-evidence-crlf-"));
  try {
    await mkdir(path.join(root, "providers", "fixtures"), { recursive: true });
    const manifest = JSON.parse(await readFile(path.resolve("providers", "compatibility-evidence.json"), "utf8"));
    await writeFile(path.join(root, "providers", "compatibility-evidence.json"), JSON.stringify(manifest));
    for (const record of manifest.providers) {
      const fixture = await readFile(path.resolve(record.fixture), "utf8");
      await writeFile(path.join(root, record.fixture), fixture.replace(/\r?\n/g, "\r\n"));
    }
    assert.equal((await verifyProviderCompatibility(root)).valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
