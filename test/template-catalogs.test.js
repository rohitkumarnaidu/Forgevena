import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fetchTemplateCatalog, listTemplateCatalogs, TemplateCatalogError, templateCatalogFetchPlan, trustTemplatePublisher, validateTemplateCatalog, verifyCachedTemplateCatalog, verifyTemplateCatalog } from "../src/template-catalogs.js";

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
    await assert.rejects(() => fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { fetchImpl, dryRun: false }), (error) => error.code === "TEMPLATE_CATALOG_CACHE_CONFLICT");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("template catalog validation and download failures are explicit", async () => {
  const valid = { schemaVersion: 1, id: "official", version: "1.0.0", templates: [] };
  const invalid = [
    [{ ...valid, schemaVersion: 2 }, "TEMPLATE_CATALOG_SCHEMA_INVALID"],
    [{ ...valid, id: "../bad" }, "TEMPLATE_CATALOG_ID_INVALID"],
    [{ ...valid, version: "one" }, "TEMPLATE_CATALOG_VERSION_INVALID"],
    [{ ...valid, templates: {} }, "TEMPLATE_CATALOG_TEMPLATES_INVALID"],
    [{ ...valid, templates: [{ id: "../bad", version: "1.0.0", manifest: "https://example.com" }] }, "TEMPLATE_CATALOG_ENTRY_INVALID"],
    [{ ...valid, templates: [{ id: "react", version: "1.0.0", manifest: "http://example.com" }] }, "TEMPLATE_CATALOG_ENTRY_HTTPS_REQUIRED"],
  ];
  for (const [value, code] of invalid) assert.throws(() => validateTemplateCatalog(value), (error) => error.code === code);
  assert.equal(validateTemplateCatalog({ ...valid, templates: [{ id: "react", version: "1.0.0", manifest: "https://example.com/template.json" }] }).templates[0].integrity, "");

  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-catalog-errors-"));
  try {
    assert.equal((await fetchTemplateCatalog(root, "https://catalog.example/catalog.json")).dryRun, true);
    assert.equal((await verifyCachedTemplateCatalog(root, "missing")).valid, false);
    assert.equal((await verifyTemplateCatalog(root, valid)).trusted, false);
    await assert.rejects(() => fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { dryRun: false, fetchImpl: async () => ({ ok: false, status: 503 }) }), (error) => error.code === "TEMPLATE_CATALOG_DOWNLOAD_FAILED");
    await assert.rejects(() => fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { dryRun: false, fetchImpl: async () => ({ ok: true, url: "http://catalog.example/catalog.json", text: async () => "{}" }) }), (error) => error.code === "TEMPLATE_CATALOG_REDIRECT_INVALID");
    await assert.rejects(() => fetchTemplateCatalog(root, "https://catalog.example/catalog.json", { dryRun: false, fetchImpl: async () => ({ ok: true, url: "https://catalog.example/catalog.json", text: async () => "x".repeat(1024 * 1024 + 1) }) }), (error) => error.code === "TEMPLATE_CATALOG_TOO_LARGE");
    await assert.rejects(() => trustTemplatePublisher(root, "../bad", "invalid"), (error) => error.code === "TEMPLATE_PUBLISHER_INVALID");
    await assert.rejects(() => trustTemplatePublisher(root, "valid", "invalid"), (error) => error.code === "TEMPLATE_PUBLISHER_KEY_INVALID");
    const { publicKey } = generateKeyPairSync("ed25519");
    const pem = publicKey.export({ type: "spki", format: "pem" });
    assert.equal((await trustTemplatePublisher(root, "valid", pem)).dryRun, true);
    assert.equal((await trustTemplatePublisher(root, "valid", pem, { dryRun: false })).trusted, true);
    assert.equal((await trustTemplatePublisher(root, "valid", pem, { dryRun: false })).skipped, true);
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
