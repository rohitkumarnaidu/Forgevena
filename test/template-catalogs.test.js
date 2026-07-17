import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fetchTemplateCatalog, listTemplateCatalogs, TemplateCatalogError, templateCatalogFetchPlan, trustTemplatePublisher, verifyCachedTemplateCatalog } from "../src/template-catalogs.js";

function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])); return value; }

test("signed template catalogs are trusted, cached, and verified offline", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-catalog-"));
  try {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    await trustTemplatePublisher(root, "example", publicKey.export({ type: "spki", format: "pem" }), { dryRun: false });
    const unsigned = { schemaVersion: 1, id: "official", version: "1.0.0", templates: [{ id: "react", version: "1.0.0", manifest: "https://templates.example/react/template.json", integrity: "sha256-example" }] };
    const value = sign(null, Buffer.from(JSON.stringify(sortObject(unsigned))), privateKey).toString("base64");
    const catalog = { ...unsigned, signature: { publisher: "example", algorithm: "ed25519", value } };
    const fetchImpl = async () => ({ ok: true, status: 200, url: "https://catalog.example/catalog.json", text: async () => JSON.stringify(catalog) });
    const installed = await fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { fetchImpl, dryRun: false });
    assert.equal(installed.trusted, true);
    assert.equal(installed.cached, true);
    assert.equal((await listTemplateCatalogs(root))[0].id, "official");
    assert.equal((await verifyCachedTemplateCatalog(root, "official")).valid, true);
    const second = await fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { fetchImpl, dryRun: false });
    assert.equal(second.created, false);
    const record = (await listTemplateCatalogs(root))[0];
    await writeFile(path.join(root, record.cachePath), `${await readFile(path.join(root, record.cachePath), "utf8")} `);
    assert.equal((await verifyCachedTemplateCatalog(root, "official")).valid, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("remote template catalogs require HTTPS and trusted signatures", async () => {
  assert.throws(() => templateCatalogFetchPlan("http://catalog.example/catalog.json"), (error) => error instanceof TemplateCatalogError && error.code === "TEMPLATE_CATALOG_HTTPS_REQUIRED");
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-catalog-untrusted-"));
  try {
    const catalog = { schemaVersion: 1, id: "unknown", version: "1.0.0", templates: [], signature: { publisher: "unknown", algorithm: "ed25519", value: "invalid" } };
    await assert.rejects(() => fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { dryRun: false, fetchImpl: async () => ({ ok: true, status: 200, url: "https://catalog.example/catalog.json", text: async () => JSON.stringify(catalog) }) }), (error) => error.code === "TEMPLATE_CATALOG_UNTRUSTED");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
