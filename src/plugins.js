import { createHash, createPublicKey, verify } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";
import { PLATFORM_VERSION } from "./version.js";

const REGISTRY_PATH = path.join(".ai-workspace", "plugins", "registry.json");
const TRUST_PATH = path.join(".ai-workspace", "plugins", "trusted-publishers.json");

export async function listPlugins(root) { return Object.values((await readRegistry(root)).plugins).sort((left, right) => left.id.localeCompare(right.id)); }

export async function pluginInstallPlan(source) {
  const remote = /^https:\/\//i.test(source);
  if (!remote && /^https?:\/\//i.test(source)) throw new Error("Remote plugin manifests require HTTPS.");
  return { source, remote, command: remote ? `download declarative plugin manifest from ${new URL(source).origin}` : `read local plugin manifest ${source}`, scope: remote ? "remote declarative plugin manifest" : "local declarative plugin manifest", dataImpact: remote ? "Downloads a manifest but does not execute plugin code." : "Reads a local manifest but does not execute plugin code.", affectedPaths: [REGISTRY_PATH, ".ai-workspace/plugins/<id>/<version>/manifest.json"], rollback: "Disable the plugin and remove its registry record; contributed external configuration remains manual." };
}

export async function installPlugin(root, source, { dryRun = true, fetchImpl = globalThis.fetch, allowUpdate = false } = {}) {
  const remote = /^https:\/\//i.test(source);
  const manifest = validateManifest(await loadManifest(source, fetchImpl));
  const signature = await verifyPluginSignature(root, manifest);
  if (remote && !signature.trusted) throw new Error(`Remote plugin manifests require a valid signature from a trusted publisher: ${signature.reason}.`);
  const registry = await readRegistry(root);
  validatePlatformConstraint(manifest.platform);
  validateDependencies(registry, manifest);
  const current = registry.plugins[manifest.id];
  if (current && !allowUpdate) return { plugin: manifest.id, dryRun, installed: false, skipped: true, message: "Plugin already exists and was not overwritten." };
  if (current && current.version === manifest.version) return { plugin: manifest.id, version: manifest.version, dryRun, updated: false, skipped: true, message: "The requested plugin version is already registered." };
  if (current && compareVersions(manifest.version, current.version) < 0) throw new Error(`Plugin downgrade from ${current.version} to ${manifest.version} is not allowed.`);
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const integrity = `sha256-${createHash("sha256").update(serialized).digest("base64")}`;
  const relative = path.join(".ai-workspace", "plugins", manifest.id, manifest.version, "manifest.json");
  if (remote && manifest.type === "runtime") throw new Error("Remote runtime plugin packages are not enabled until signed package transport is implemented.");
  const plan = { plugin: manifest.id, version: manifest.version, previousVersion: current?.version ?? null, integrity, signature, dryRun, create: [relative, REGISTRY_PATH], enabled: current?.enabled ?? false, executableCode: manifest.type === "runtime", update: Boolean(current) };
  if (dryRun) return plan;
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, serialized, "utf8");
  registry.plugins[manifest.id] = { id: manifest.id, version: manifest.version, type: manifest.type, platform: manifest.platform, source, entry: manifest.entry ?? null, capabilities: manifest.capabilities ?? [], dependencies: manifest.dependencies ?? {}, integrity, signature, enabled: current?.enabled ?? false, permissions: manifest.permissions, contributions: manifest.contributions ?? {}, installedAt: current?.installedAt ?? new Date().toISOString(), updatedAt: current ? new Date().toISOString() : null, previousVersions: current ? [...new Set([...(current.previousVersions ?? []), current.version])] : [] };
  await writeRegistry(root, registry);
  return { ...plan, dryRun: false, installed: !current, updated: Boolean(current) };
}

export async function updatePlugin(root, source, options = {}) { return installPlugin(root, source, { ...options, allowUpdate: true }); }

export async function pluginHealth(root, id) {
  const validation = await validatePlugin(root, id);
  const plugin = (await readRegistry(root)).plugins[id];
  return { plugin: id, healthy: validation.valid === true, enabled: plugin?.enabled ?? false, version: plugin?.version ?? null, validation };
}

export async function setPluginEnabled(root, id, enabled, { dryRun = true } = {}) {
  const registry = await readRegistry(root);
  const plugin = registry.plugins[id];
  if (!plugin) throw new Error(`Unknown plugin: ${id}.`);
  const plan = { plugin: id, enabled, dryRun, permissions: plugin.permissions, contributions: plugin.contributions, executableCode: false };
  if (dryRun) return plan;
  plugin.enabled = enabled;
  plugin.updatedAt = new Date().toISOString();
  await writeRegistry(root, registry);
  return { ...plan, dryRun: false };
}

export async function validatePlugin(root, id) {
  const plugin = (await readRegistry(root)).plugins[id];
  if (!plugin) return { plugin: id, valid: false, issues: ["Plugin is not registered."] };
  const relative = path.join(".ai-workspace", "plugins", plugin.id, plugin.version, "manifest.json");
  try {
    const serialized = await readFile(path.join(root, relative), "utf8");
    const integrity = `sha256-${createHash("sha256").update(serialized).digest("base64")}`;
    const manifest = JSON.parse(serialized);
    const signature = await verifyPluginSignature(root, manifest);
    return { plugin: id, valid: integrity === plugin.integrity && (!plugin.signature?.trusted || signature.trusted), integrity, expectedIntegrity: plugin.integrity, signature, executableCode: false };
  } catch {
    return { plugin: id, valid: false, issues: ["Stored manifest is missing."] };
  }
}

export async function trustPluginPublisher(root, publisher, publicKeyPem, { dryRun = true } = {}) {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(publisher ?? "")) throw new Error("Publisher id must be 1-64 safe characters.");
  try { createPublicKey(publicKeyPem); } catch { throw new Error("Publisher key must be a valid public key in PEM format."); }
  const trust = await readTrustStore(root);
  if (trust.publishers[publisher]) return { publisher, dryRun, trusted: false, skipped: true, message: "Publisher already exists and was not overwritten." };
  const plan = { publisher, dryRun, create: [TRUST_PATH], fingerprint: createHash("sha256").update(publicKeyPem).digest("hex"), storesPrivateKey: false };
  if (dryRun) return plan;
  trust.publishers[publisher] = { publicKeyPem, fingerprint: plan.fingerprint, trustedAt: new Date().toISOString() };
  await writeTrustStore(root, trust);
  return { ...plan, dryRun: false, trusted: true };
}

export async function verifyPluginSignature(root, manifest) {
  if (!manifest.signature) return { present: false, trusted: false, reason: "manifest is unsigned" };
  const { publisher, algorithm, value } = manifest.signature;
  if (algorithm !== "ed25519" || !publisher || !value) return { present: true, trusted: false, reason: "signature metadata is invalid" };
  const publisherRecord = (await readTrustStore(root)).publishers[publisher];
  if (!publisherRecord) return { present: true, trusted: false, publisher, reason: "publisher is not trusted" };
  const payload = canonicalManifest(manifest);
  let valid = false;
  try { valid = verify(null, Buffer.from(payload), createPublicKey(publisherRecord.publicKeyPem), Buffer.from(value, "base64")); } catch { valid = false; }
  return { present: true, trusted: valid, publisher, algorithm, fingerprint: publisherRecord.fingerprint, reason: valid ? null : "signature verification failed" };
}

export async function removePlugin(root, id, { dryRun = true } = {}) {
  const registry = await readRegistry(root);
  if (!registry.plugins[id]) return { plugin: id, removed: false, dryRun, message: "Plugin is not registered." };
  const plan = { plugin: id, dryRun, registryOnly: true, cachedManifestPreserved: true };
  if (dryRun) return plan;
  delete registry.plugins[id];
  await writeRegistry(root, registry);
  return { ...plan, dryRun: false, removed: true };
}

export async function pluginPermissions(root, id) { const plugin = (await readRegistry(root)).plugins[id]; if (!plugin) throw new Error(`Unknown plugin: ${id}.`); return { plugin: id, type: plugin.type ?? "declarative", enabled: plugin.enabled, permissions: plugin.permissions ?? [], capabilities: plugin.capabilities ?? [], credentialsExposed: false }; }
export async function pluginDependencies(root, id) { const registry = await readRegistry(root); const plugin = registry.plugins[id]; if (!plugin) throw new Error(`Unknown plugin: ${id}.`); return { plugin: id, dependencies: Object.entries(plugin.dependencies ?? {}).map(([dependency, constraint]) => ({ plugin: dependency, constraint, installedVersion: registry.plugins[dependency]?.version ?? null, satisfied: Boolean(registry.plugins[dependency] && satisfiesVersion(registry.plugins[dependency].version, constraint)) })) }; }

function validateManifest(value) {
  if (![1, 2].includes(value?.schemaVersion)) throw new Error("Plugin schemaVersion must be 1 or 2.");
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value.id ?? "")) throw new Error("Plugin id must be 1-64 safe characters.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version ?? "")) throw new Error("Plugin version must use semantic versioning.");
  if (value.schemaVersion === 1 && value.type !== "declarative") throw new Error("Schema-version 1 accepts declarative plugins only; executable plugins require the reviewed schema-version 2 runtime contract.");
  if (value.schemaVersion === 2 && value.type !== "runtime") throw new Error("Schema-version 2 plugins must use type runtime.");
  const allowedPermissions = new Set(value.type === "runtime" ? ["workspace:read", "workspace:write-managed", "provider:invoke", "network:http", "audit:write"] : ["provider-profile", "mcp-definition", "documentation", "template-metadata"]);
  const permissions = Array.isArray(value.permissions) ? [...new Set(value.permissions.map(String))] : [];
  if (permissions.some((permission) => !allowedPermissions.has(permission))) throw new Error("Plugin requests an unsupported permission.");
  const dependencies = value.dependencies && typeof value.dependencies === "object" && !Array.isArray(value.dependencies) ? Object.fromEntries(Object.entries(value.dependencies).map(([id, constraint]) => [String(id), String(constraint)])) : {};
  const manifest = value.type === "runtime" ? { schemaVersion: 2, id: value.id, version: value.version, type: "runtime", platform: value.platform ?? ">=1.1.0", permissions, entry: value.entry, capabilities: Array.isArray(value.capabilities) ? value.capabilities.map(String) : [], dependencies, timeoutMs: value.timeoutMs, maxOutputBytes: value.maxOutputBytes } : { schemaVersion: 1, id: value.id, version: value.version, type: "declarative", platform: value.platform ?? ">=0.2.0", permissions, dependencies, contributions: value.contributions && typeof value.contributions === "object" ? value.contributions : {} };
  if (Object.keys(dependencies).length === 0) delete manifest.dependencies;
  if (value.signature !== undefined) manifest.signature = value.signature;
  return manifest;
}

export async function runtimePluginDefinition(root, id) { const plugin = (await readRegistry(root)).plugins[id]; if (!plugin) throw new Error(`Unknown plugin: ${id}.`); if (plugin.type !== "runtime") throw new Error(`${id} is not a runtime plugin.`); if (!plugin.enabled) throw new Error(`${id} must be enabled before execution.`); if (/^https:/i.test(plugin.source)) throw new Error("Remote runtime packages are not enabled."); const manifest = JSON.parse(await readFile(path.join(root, ".ai-workspace", "plugins", id, plugin.version, "manifest.json"), "utf8")); return { directory: path.dirname(path.resolve(plugin.source)), manifest }; }

async function loadManifest(source, fetchImpl) {
  if (/^https:\/\//i.test(source)) {
    const response = await fetchImpl(source);
    if (!response.ok) throw new Error(`Plugin manifest download failed with HTTP ${response.status}.`);
    if (!String(response.url || source).startsWith("https://")) throw new Error("Plugin manifest redirects must remain on HTTPS.");
    const text = await response.text();
    if (Buffer.byteLength(text) > 256 * 1024) throw new Error("Plugin manifest exceeds 256 KiB.");
    return JSON.parse(text);
  }
  const target = path.resolve(source);
  if ((await stat(target)).size > 256 * 1024) throw new Error("Plugin manifest exceeds 256 KiB.");
  return JSON.parse(await readFile(target, "utf8"));
}
async function readRegistry(root) { return { schemaVersion: 1, plugins: {}, ...(await readStateDocument(root, REGISTRY_PATH, { schemaVersion: 1, plugins: {} })) }; }
async function writeRegistry(root, registry) { registry.updatedAt = new Date().toISOString(); await writeStateDocument(root, REGISTRY_PATH, registry, (value) => value?.schemaVersion === 1 && value.plugins && typeof value.plugins === "object" ? true : ["Plugin registry requires schemaVersion 1 and plugins."]); }
async function readTrustStore(root) { return { schemaVersion: 1, publishers: {}, ...(await readStateDocument(root, TRUST_PATH, { schemaVersion: 1, publishers: {} })) }; }
async function writeTrustStore(root, trust) { trust.updatedAt = new Date().toISOString(); await writeStateDocument(root, TRUST_PATH, trust, (value) => value?.schemaVersion === 1 && value.publishers && typeof value.publishers === "object" ? true : ["Plugin trust store requires schemaVersion 1 and publishers."]); }
function canonicalManifest(manifest) { const { signature: _signature, ...unsigned } = manifest; return JSON.stringify(sortObject(unsigned)); }
function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])); return value; }
function compareVersions(left, right) { const parse = (value) => value.split("-")[0].split(".").map(Number); const a = parse(left), b = parse(right); for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index]; return 0; }
function satisfiesVersion(version, constraint) { if (/^>=\d+\.\d+\.\d+$/.test(constraint)) return compareVersions(version, constraint.slice(2)) >= 0; if (/^\^\d+\.\d+\.\d+$/.test(constraint)) { const minimum = constraint.slice(1); return version.split(".")[0] === minimum.split(".")[0] && compareVersions(version, minimum) >= 0; } return version === constraint; }
function validatePlatformConstraint(constraint) { if (!satisfiesVersion(PLATFORM_VERSION, constraint)) throw new Error(`Plugin requires Forgevena ${constraint}; current version is ${PLATFORM_VERSION}.`); }
function validateDependencies(registry, manifest) { for (const [id, constraint] of Object.entries(manifest.dependencies ?? {})) { if (id === manifest.id) throw new Error("Plugin dependency graph contains a self-cycle."); const dependency = registry.plugins[id]; if (!dependency || !satisfiesVersion(dependency.version, constraint)) throw new Error(`Plugin dependency ${id}@${constraint} is not satisfied.`); if (Object.hasOwn(dependency.dependencies ?? {}, manifest.id)) throw new Error(`Plugin dependency cycle detected between ${manifest.id} and ${id}.`); } }
