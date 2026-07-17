import { createHash, createPublicKey, verify } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateOrganizationPolicy } from "./org-policy.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";
import { PLATFORM_VERSION } from "./version.js";

const REGISTRY_PATH = path.join(".ai-workspace", "skills", "registry.json");
const TRUST_PATH = path.join(".ai-workspace", "skills", "trusted-publishers.json");
const CACHE_ROOT = path.join(".ai-workspace", "skills", "packages");

export class EngineeringAssetError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "EngineeringAssetError"; this.code = code; this.details = details; }
}

export async function trustEngineeringAssetPublisher(root, publisher, publicKeyPem, { dryRun = true } = {}) {
  if (!safeId(publisher)) throw new EngineeringAssetError("SKILL_PUBLISHER_INVALID", "Publisher id must use safe characters.");
  try { createPublicKey(publicKeyPem); } catch { throw new EngineeringAssetError("SKILL_PUBLISHER_KEY_INVALID", "Publisher key must be valid PEM."); }
  const trust = await readTrust(root);
  if (trust.publishers[publisher]) return { publisher, dryRun, skipped: true, trusted: false, message: "Publisher already exists and was not overwritten." };
  const fingerprint = createHash("sha256").update(publicKeyPem).digest("hex");
  if (dryRun) return { publisher, fingerprint, dryRun, create: [TRUST_PATH], storesPrivateKey: false };
  trust.publishers[publisher] = { publicKeyPem, fingerprint, trustedAt: new Date().toISOString() };
  await writeStateDocument(root, TRUST_PATH, trust, validateTrust);
  return { publisher, fingerprint, trusted: true, dryRun: false, storesPrivateKey: false };
}

export async function verifyEngineeringAsset(root, source) {
  try {
    const manifest = validateEngineeringAsset(JSON.parse(await readFile(path.resolve(source), "utf8")));
    const signature = await verifySignature(root, manifest);
    return { valid: signature.trusted && compatible(manifest.compatibility.forgevena), id: manifest.id, version: manifest.version, kind: manifest.kind, provenance: manifest.provenance, variables: manifest.variables, compatibility: manifest.compatibility, signature };
  } catch (error) { return { valid: false, error: { code: error.code ?? "SKILL_INVALID", message: error.message } }; }
}

export async function installEngineeringAsset(root, source, { principal, dryRun = true, authorizeImpl = evaluateOrganizationPolicy } = {}) {
  if (!principal) throw new EngineeringAssetError("SKILL_PRINCIPAL_REQUIRED", "Skill installation requires an organization-policy principal.");
  const manifest = validateEngineeringAsset(JSON.parse(await readFile(path.resolve(source), "utf8")));
  const signature = await verifySignature(root, manifest);
  if (!signature.trusted) throw new EngineeringAssetError("SKILL_SIGNATURE_UNTRUSTED", `Asset signature is not trusted: ${signature.reason}.`);
  if (!compatible(manifest.compatibility.forgevena)) throw new EngineeringAssetError("SKILL_PLATFORM_INCOMPATIBLE", `Asset requires Forgevena ${manifest.compatibility.forgevena}.`);
  const authorization = await authorizeImpl(root, { principal, action: `${manifest.kind}.install`, resource: `${manifest.kind}:${manifest.id}`, capability: manifest.capabilities[0] });
  if (authorization.decision !== "allow") throw new EngineeringAssetError("SKILL_POLICY_DENIED", `Organization policy denied ${manifest.kind} installation.`, { authorization });
  const registry = await readRegistry(root);
  const key = `${manifest.kind}:${manifest.id}`;
  const current = registry.assets[key];
  if (current?.version === manifest.version) return { id: manifest.id, kind: manifest.kind, version: manifest.version, dryRun, skipped: true, message: "Asset version is already registered." };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const integrity = createHash("sha256").update(serialized).digest("hex");
  const relative = path.join(CACHE_ROOT, manifest.kind, manifest.id, manifest.version, "manifest.json");
  const plan = { id: manifest.id, kind: manifest.kind, version: manifest.version, previousVersion: current?.version ?? null, principal, authorization, signature, integrity, dryRun, create: [relative, REGISTRY_PATH], executable: false };
  if (dryRun) return plan;
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  try { await writeFile(target, serialized, { encoding: "utf8", flag: "wx" }); } catch (error) { if (error?.code !== "EEXIST") throw error; if (await readFile(target, "utf8") !== serialized) throw new EngineeringAssetError("SKILL_CACHE_CONFLICT", "Immutable asset cache contains different contents."); }
  registry.assets[key] = { id: manifest.id, kind: manifest.kind, version: manifest.version, previousVersions: current ? [...new Set([...(current.previousVersions ?? []), current.version])] : [], provenance: manifest.provenance, variables: manifest.variables, capabilities: manifest.capabilities, compatibility: manifest.compatibility, integrity, signature, cachePath: relative.replaceAll("\\", "/"), installedBy: principal, installedAt: new Date().toISOString() };
  await writeStateDocument(root, REGISTRY_PATH, registry, validateRegistry);
  return { ...plan, dryRun: false, installed: true };
}

export async function listEngineeringAssets(root, kind) { return Object.values((await readRegistry(root)).assets).filter((asset) => !kind || asset.kind === kind).sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`)); }
export async function engineeringAssetStatus(root, kind, id) { const asset = (await readRegistry(root)).assets[`${kind}:${id}`]; return asset ? { registered: true, ...asset, contentIncluded: false } : { registered: false, kind, id }; }
export async function removeEngineeringAsset(root, kind, id, { dryRun = true } = {}) { const registry = await readRegistry(root); const key = `${kind}:${id}`; if (!registry.assets[key]) return { kind, id, removed: false, dryRun }; const plan = { kind, id, dryRun, registryOnly: true, cachedPackagePreserved: true }; if (dryRun) return plan; delete registry.assets[key]; await writeStateDocument(root, REGISTRY_PATH, registry, validateRegistry); return { ...plan, dryRun: false, removed: true }; }

export function validateEngineeringAsset(value) {
  if (value?.schemaVersion !== 1) throw new EngineeringAssetError("SKILL_SCHEMA_INVALID", "Engineering asset schemaVersion must be 1.");
  if (!['prompt', 'skill'].includes(value.kind)) throw new EngineeringAssetError("SKILL_KIND_INVALID", "Engineering asset kind must be prompt or skill.");
  if (!safeId(value.id)) throw new EngineeringAssetError("SKILL_ID_INVALID", "Engineering asset id must use safe characters.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version ?? "")) throw new EngineeringAssetError("SKILL_VERSION_INVALID", "Engineering asset version must use semantic versioning.");
  if (typeof value.content !== "string" || !value.content.trim()) throw new EngineeringAssetError("SKILL_CONTENT_INVALID", "Engineering assets require non-empty content.");
  const provenance = value.provenance ?? {};
  if (!provenance.author || !provenance.source || !provenance.license) throw new EngineeringAssetError("SKILL_PROVENANCE_INVALID", "Engineering assets require author, source, and license provenance.");
  const variables = (value.variables ?? []).map((variable) => { if (!safeId(variable?.name)) throw new EngineeringAssetError("SKILL_VARIABLE_INVALID", "Variable names must use safe characters."); return { name: variable.name, required: variable.required !== false, description: String(variable.description ?? "") }; });
  if (new Set(variables.map(({ name }) => name)).size !== variables.length) throw new EngineeringAssetError("SKILL_VARIABLE_DUPLICATE", "Variable names must be unique.");
  return { schemaVersion: 1, kind: value.kind, id: value.id, version: value.version, description: String(value.description ?? ""), content: value.content, provenance: { author: String(provenance.author), source: String(provenance.source), license: String(provenance.license) }, variables, capabilities: [...new Set((value.capabilities ?? []).map(String))], compatibility: { forgevena: String(value.compatibility?.forgevena ?? ">=1.1.0") }, signature: value.signature };
}

export function canonicalEngineeringAsset(manifest) { const { signature: _signature, ...unsigned } = manifest; return JSON.stringify(sortObject(unsigned)); }
async function verifySignature(root, manifest) { const { publisher, algorithm, value } = manifest.signature ?? {}; if (algorithm !== "ed25519" || !publisher || !value) return { present: Boolean(manifest.signature), trusted: false, reason: "signature metadata is invalid" }; const record = (await readTrust(root)).publishers[publisher]; if (!record) return { present: true, trusted: false, publisher, reason: "publisher is not trusted" }; let valid = false; try { valid = verify(null, Buffer.from(canonicalEngineeringAsset(manifest)), createPublicKey(record.publicKeyPem), Buffer.from(value, "base64")); } catch { valid = false; } return { present: true, trusted: valid, publisher, fingerprint: record.fingerprint, reason: valid ? null : "signature verification failed" }; }
function compatible(constraint) { if (/^>=\d+\.\d+\.\d+$/.test(constraint)) return compare(PLATFORM_VERSION, constraint.slice(2)) >= 0; return constraint === PLATFORM_VERSION; }
function compare(left, right) { const a = left.split("-")[0].split(".").map(Number), b = right.split("-")[0].split(".").map(Number); for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index]; return 0; }
async function readTrust(root) { return { schemaVersion: 1, publishers: {}, ...(await readStateDocument(root, TRUST_PATH, { schemaVersion: 1, publishers: {} }, validateTrust)) }; }
async function readRegistry(root) { return { schemaVersion: 1, assets: {}, ...(await readStateDocument(root, REGISTRY_PATH, { schemaVersion: 1, assets: {} }, validateRegistry)) }; }
function validateTrust(value) { return value?.schemaVersion === 1 && value.publishers && typeof value.publishers === "object" ? true : ["Engineering asset trust store is invalid."]; }
function validateRegistry(value) { return value?.schemaVersion === 1 && value.assets && typeof value.assets === "object" ? true : ["Engineering asset registry is invalid."]; }
function safeId(value) { return /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value ?? ""); }
function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])); return value; }
