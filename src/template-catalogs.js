import { createHash, createPublicKey, verify } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const TRUST_PATH = path.join(".ai-workspace", "templates", "trusted-publishers.json");
const REGISTRY_PATH = path.join(".ai-workspace", "templates", "catalogs.json");
const CACHE_ROOT = path.join(".ai-workspace", "templates", "catalog-cache");

export class TemplateCatalogError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "TemplateCatalogError"; this.code = code; this.details = details; }
}

export async function trustTemplatePublisher(root, publisher, publicKeyPem, { dryRun = true } = {}) {
  if (!safeId(publisher)) throw new TemplateCatalogError("TEMPLATE_PUBLISHER_INVALID", "Publisher id must use 1-64 safe characters.");
  try { createPublicKey(publicKeyPem); } catch { throw new TemplateCatalogError("TEMPLATE_PUBLISHER_KEY_INVALID", "Publisher key must be a valid public key in PEM format."); }
  const trust = await readTrust(root);
  if (trust.publishers[publisher]) return { publisher, dryRun, trusted: false, skipped: true, message: "Publisher already exists and was not overwritten." };
  const fingerprint = createHash("sha256").update(publicKeyPem).digest("hex");
  if (dryRun) return { publisher, fingerprint, dryRun, create: [TRUST_PATH], storesPrivateKey: false };
  trust.publishers[publisher] = { publicKeyPem, fingerprint, trustedAt: new Date().toISOString() };
  await writeStateDocument(root, TRUST_PATH, trust, validateTrust);
  return { publisher, fingerprint, dryRun: false, trusted: true, storesPrivateKey: false };
}

export function templateCatalogFetchPlan(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new TemplateCatalogError("TEMPLATE_CATALOG_HTTPS_REQUIRED", "Remote template catalogs require HTTPS.");
  return { command: `download signed template catalog from ${parsed.origin}`, scope: "signed template catalog", dataImpact: "Downloads public template metadata and verifies its trusted publisher signature.", affectedPaths: [REGISTRY_PATH, CACHE_ROOT], rollback: "Remove the registry record; immutable cached evidence is retained for audit.", url: parsed.href };
}

export async function fetchTemplateCatalog(root, url, { fetchImpl = globalThis.fetch, dryRun = true } = {}) {
  const plan = templateCatalogFetchPlan(url);
  if (dryRun) return { ...plan, dryRun: true };
  const response = await fetchImpl(plan.url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new TemplateCatalogError("TEMPLATE_CATALOG_DOWNLOAD_FAILED", `Template catalog download failed with HTTP ${response.status}.`);
  if (!String(response.url || plan.url).startsWith("https://")) throw new TemplateCatalogError("TEMPLATE_CATALOG_REDIRECT_INVALID", "Template catalog redirects must remain on HTTPS.");
  const serialized = await response.text();
  if (Buffer.byteLength(serialized) > 1024 * 1024) throw new TemplateCatalogError("TEMPLATE_CATALOG_TOO_LARGE", "Template catalog exceeds 1 MiB.");
  const catalog = validateTemplateCatalog(JSON.parse(serialized));
  const signature = await verifyTemplateCatalog(root, catalog);
  if (!signature.trusted) throw new TemplateCatalogError("TEMPLATE_CATALOG_UNTRUSTED", `Template catalog signature is not trusted: ${signature.reason}.`);
  const relative = path.join(CACHE_ROOT, catalog.id, catalog.version, "catalog.json");
  const target = path.join(root, relative);
  const cached = `${JSON.stringify(catalog, null, 2)}\n`;
  await mkdir(path.dirname(target), { recursive: true });
  let created = true;
  try { await writeFile(target, cached, { encoding: "utf8", flag: "wx" }); } catch (error) { if (error?.code !== "EEXIST") throw error; created = false; const existing = await readFile(target, "utf8"); if (existing !== cached) throw new TemplateCatalogError("TEMPLATE_CATALOG_CACHE_CONFLICT", "An immutable catalog cache entry already exists with different contents."); }
  const registry = await readRegistry(root);
  registry.catalogs[catalog.id] = { id: catalog.id, version: catalog.version, publisher: catalog.signature.publisher, source: plan.url, cachePath: relative.replaceAll("\\", "/"), checksum: createHash("sha256").update(cached).digest("hex"), verifiedAt: new Date().toISOString() };
  await writeStateDocument(root, REGISTRY_PATH, registry, validateRegistry);
  return { catalog: catalog.id, version: catalog.version, publisher: catalog.signature.publisher, trusted: true, cached: true, created, cachePath: relative, dryRun: false };
}

export async function verifyCachedTemplateCatalog(root, id) {
  const record = (await readRegistry(root)).catalogs[id];
  if (!record) return { catalog: id, valid: false, issues: ["Catalog is not registered."] };
  try {
    const serialized = await readFile(path.join(root, record.cachePath), "utf8");
    const checksum = createHash("sha256").update(serialized).digest("hex");
    const catalog = validateTemplateCatalog(JSON.parse(serialized));
    const signature = await verifyTemplateCatalog(root, catalog);
    return { catalog: id, version: catalog.version, valid: checksum === record.checksum && signature.trusted, checksum, expectedChecksum: record.checksum, signature, offline: true };
  } catch (error) { return { catalog: id, valid: false, issues: [error.message], offline: true }; }
}

export async function listTemplateCatalogs(root) { return Object.values((await readRegistry(root)).catalogs).sort((left, right) => left.id.localeCompare(right.id)); }

export async function verifyTemplateCatalog(root, catalog) {
  const { publisher, algorithm, value } = catalog.signature ?? {};
  if (algorithm !== "ed25519" || !publisher || !value) return { present: Boolean(catalog.signature), trusted: false, reason: "signature metadata is invalid" };
  const publisherRecord = (await readTrust(root)).publishers[publisher];
  if (!publisherRecord) return { present: true, trusted: false, publisher, reason: "publisher is not trusted" };
  let valid = false;
  try { valid = verify(null, Buffer.from(canonicalCatalog(catalog)), createPublicKey(publisherRecord.publicKeyPem), Buffer.from(value, "base64")); } catch { valid = false; }
  return { present: true, trusted: valid, publisher, algorithm, fingerprint: publisherRecord.fingerprint, reason: valid ? null : "signature verification failed" };
}

export function validateTemplateCatalog(value) {
  if (value?.schemaVersion !== 1) throw new TemplateCatalogError("TEMPLATE_CATALOG_SCHEMA_INVALID", "Template catalog schemaVersion must be 1.");
  if (!safeId(value.id)) throw new TemplateCatalogError("TEMPLATE_CATALOG_ID_INVALID", "Template catalog id must use 1-64 safe characters.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version ?? "")) throw new TemplateCatalogError("TEMPLATE_CATALOG_VERSION_INVALID", "Template catalog version must use semantic versioning.");
  if (!Array.isArray(value.templates)) throw new TemplateCatalogError("TEMPLATE_CATALOG_TEMPLATES_INVALID", "Template catalog templates must be an array.");
  const templates = value.templates.map((entry) => { if (!safeId(entry?.id) || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(entry?.version ?? "")) throw new TemplateCatalogError("TEMPLATE_CATALOG_ENTRY_INVALID", "Template entries require a safe id and semantic version."); const manifest = new URL(entry.manifest); if (manifest.protocol !== "https:") throw new TemplateCatalogError("TEMPLATE_CATALOG_ENTRY_HTTPS_REQUIRED", "Remote template manifests require HTTPS."); return { id: entry.id, version: entry.version, manifest: manifest.href, integrity: String(entry.integrity ?? "") }; });
  return { schemaVersion: 1, id: value.id, version: value.version, templates, signature: value.signature };
}

function canonicalCatalog(catalog) { const { signature: _signature, ...unsigned } = catalog; return JSON.stringify(sortObject(unsigned)); }
function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])); return value; }
function safeId(value) { return /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value ?? ""); }
function validateTrust(value) { return value?.schemaVersion === 1 && value.publishers && typeof value.publishers === "object" ? true : ["Template publisher trust store is invalid."]; }
function validateRegistry(value) { return value?.schemaVersion === 1 && value.catalogs && typeof value.catalogs === "object" ? true : ["Template catalog registry is invalid."]; }
async function readTrust(root) { return { schemaVersion: 1, publishers: {}, ...(await readStateDocument(root, TRUST_PATH, { schemaVersion: 1, publishers: {} }, validateTrust)) }; }
async function readRegistry(root) { return { schemaVersion: 1, catalogs: {}, ...(await readStateDocument(root, REGISTRY_PATH, { schemaVersion: 1, catalogs: {} }, validateRegistry)) }; }
