import { createCipheriv, createDecipheriv, createHash, pbkdf2, randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { Algorithm, hashRaw } from "@node-rs/argon2";

export const CREDENTIAL_DEFINITIONS = Object.freeze({
  openai: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  cursor: "CURSOR_API_KEY",
  render: "RENDER_API_KEY",
  vercel: "VERCEL_TOKEN",
  railway: "RAILWAY_TOKEN",
  flyio: "FLY_API_TOKEN",
  azure: "AZURE_CLIENT_SECRET",
  aws: "AWS_SECRET_ACCESS_KEY",
  googlecloud: "GOOGLE_APPLICATION_CREDENTIALS",
  digitalocean: "DIGITALOCEAN_ACCESS_TOKEN",
});

const SECRET_DIRECTORY = path.join(".ai-workspace", "local-secrets");
const VAULT_SCHEMA_VERSION = 2;
const PBKDF2_ITERATIONS = 600_000;
const SLOT_SCHEMA_VERSION = 1;
const SLOT_RETENTION_DAYS = 30;
const SLOT_HISTORY_LIMIT = 5;
const SLOT_AUDIT_LIMIT = 100;
const SLOT_ID_PATTERN = /^(?:primary|[a-z][a-z0-9-]{0,31})$/;
const derivePbkdf2 = promisify(pbkdf2);

export function listCredentialDefinitions() {
  return Object.entries(CREDENTIAL_DEFINITIONS).map(([name, environmentVariable]) => ({ name, environmentVariable }));
}

export async function initializeCredentialPlaceholders(root, { dryRun = true } = {}) {
  const relative = ".env.example";
  const target = path.join(root, relative);
  const exists = await pathExists(target);
  const plan = { dryRun, create: exists ? [] : [relative], skipped: exists ? [relative] : [], containsSecrets: false };
  if (dryRun || exists) return plan;
  const contents = [
    "# Copy only the variables you need into an approved local secret store.",
    "# The AI Workspace CLI stores each development credential separately under .ai-workspace/local-secrets/.",
    ...Object.values(CREDENTIAL_DEFINITIONS).map((variable) => `${variable}=`),
    "",
  ].join("\n");
  await writeFile(target, contents, "utf8");
  return { ...plan, dryRun: false, created: [relative] };
}

export async function configureCredential(root, name, secret, { dryRun = true, storage = "local", keyId = "primary" } = {}) {
  const environmentVariable = credentialVariable(name);
  validateKeyId(keyId);
  if (!["local", "encrypted"].includes(storage)) throw new Error("Credential storage must be local or encrypted.");
  await cleanupExpiredQuarantine(root, name);
  const relative = credentialPath(name, keyId, storage);
  const target = path.join(root, relative);
  const exists = await pathExists(target);
  const plan = {
    credential: name,
    keyId,
    environmentVariable,
    storage,
    dryRun,
    create: exists ? [] : [relative],
    skipped: exists ? [relative] : [],
    secretHandling: "Accepted only from a masked local prompt or loopback dashboard, stored in a provider-specific ignored file, and never logged, returned, or persisted in the registry.",
  };
  if (dryRun) return plan;
  if (!secret?.trim()) throw new Error(`A non-empty ${environmentVariable} value is required.`);
  if (exists) return { ...plan, dryRun: false, configured: false, manualRequired: true, message: `${relative} already exists and was not modified. Rotate it manually to preserve the never-overwrite guarantee.` };
  await mkdir(path.dirname(target), { recursive: true });
  const contents = storage === "encrypted" ? await encryptCredential(environmentVariable, secret.trim()) : `${environmentVariable}=${secret.trim()}\n`;
  await writeFile(target, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
  await updateSlotManifest(root, name, (manifest) => {
    const now = new Date().toISOString();
    const slots = { ...manifest.slots, [keyId]: { keyId, storage, status: "active", createdAt: manifest.slots[keyId]?.createdAt ?? now, rotatedAt: manifest.slots[keyId]?.rotatedAt ?? null, validatedAt: null } };
    return appendSlotAudit({ ...manifest, activeKeyId: manifest.activeKeyId ?? keyId, slots }, { action: "configured", keyId, storage, at: now });
  });
  return { ...plan, dryRun: false, configured: true, credentialStored: relative, activeKeyId: (await readSlotManifest(root, name)).activeKeyId };
}

export async function credentialStatus(root, name, { keyId = null } = {}) {
  const environmentVariable = credentialVariable(name);
  await cleanupExpiredQuarantine(root, name);
  const manifest = await readSlotManifest(root, name);
  const activeKeyId = keyId ?? manifest.activeKeyId ?? "primary";
  validateKeyId(activeKeyId);
  const source = process.env[environmentVariable]
    ? "process-environment"
    : await storageForSlot(root, name, activeKeyId)
      ?? (activeKeyId === "primary" && await legacyEnvironmentContains(root, environmentVariable) ? "legacy-dotenv" : null);
  return { credential: name, environmentVariable, keyId: activeKeyId, activeKeyId: manifest.activeKeyId ?? "primary", configured: Boolean(source), source, slots: await listCredentialKeys(root, name, { manifest }) };
}

export async function readCredential(root, nameOrVariable) {
  const entry = Object.entries(CREDENTIAL_DEFINITIONS).find(([name, variable]) => name === nameOrVariable || variable === nameOrVariable);
  if (!entry) throw new Error(`Unknown credential: ${nameOrVariable}.`);
  const [name, environmentVariable] = entry;
  if (process.env[environmentVariable]) return process.env[environmentVariable];
  const manifest = await readSlotManifest(root, name);
  const keyId = manifest.activeKeyId ?? "primary";
  const encrypted = await readEncryptedCredential(path.join(root, credentialPath(name, keyId, "encrypted")), environmentVariable);
  if (encrypted) return encrypted;
  const managed = await readVariable(path.join(root, credentialPath(name, keyId, "local")), environmentVariable);
  return managed || await readVariable(path.join(root, ".env"), environmentVariable);
}

export async function validateCredential(root, name, { keyId = null, dryRun = true } = {}) {
  const status = await credentialStatus(root, name, { keyId });
  if (!status.configured) return { ...status, valid: false, issues: ["Credential is not configured."] };
  if (status.source === "process-environment") return { ...status, valid: true, issues: [], validationRecorded: false, message: "The owning process environment was detected but is not managed or audited by Forgevena." };
  try {
    const value = await readManagedSlot(root, name, status.keyId, status.source);
    const valid = Boolean(value?.trim());
    const result = { ...status, valid, issues: valid ? [] : ["Credential value is empty or unreadable."], validationRecorded: false };
    if (!valid || dryRun) return result;
    const at = new Date().toISOString();
    await updateSlotManifest(root, name, (manifest) => appendSlotAudit({ ...manifest, slots: { ...manifest.slots, [status.keyId]: { ...(manifest.slots[status.keyId] ?? { keyId: status.keyId }), validatedAt: at } } }, { action: "validated", keyId: status.keyId, at }));
    return { ...result, validationRecorded: true, validatedAt: at };
  } catch (error) { return { ...status, valid: false, issues: [error.message], validationRecorded: false }; }
}

export async function rotateCredential(root, name, secret, { dryRun = true, storage = "local", keyId = "primary" } = {}) {
  validateKeyId(keyId);
  const status = await credentialStatus(root, name, { keyId });
  if (!status.configured || ["process-environment", "legacy-dotenv"].includes(status.source)) return { credential: name, dryRun, rotated: false, manualRequired: true, message: "Only workspace-managed credentials can be rotated. Rotate external credentials through their owning secret manager." };
  const source = credentialPath(name, keyId, status.source === "encrypted-local-secret" ? "encrypted" : "local");
  const archive = slotArchivePath(name, keyId, source, "archive");
  const plan = { credential: name, keyId, dryRun, move: { from: source, to: archive }, replacementStorage: storage, secretReturned: false };
  if (dryRun) return plan;
  if (!secret?.trim()) throw new Error("A non-empty replacement credential is required.");
  const sourcePath = path.join(root, source);
  const archivePath = path.join(root, archive);
  const replacement = path.join(root, credentialPath(name, keyId, storage));
  const temporary = `${replacement}.${Date.now()}.rotation`;
  await mkdir(path.dirname(archivePath), { recursive: true });
  await mkdir(path.dirname(replacement), { recursive: true });
  const contents = storage === "encrypted" ? await encryptCredential(credentialVariable(name), secret.trim(), { previousVersion: await credentialVersion(sourcePath) }) : `${credentialVariable(name)}=${secret.trim()}\n`;
  await writeFile(temporary, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
  try {
    await copyFile(sourcePath, archivePath);
    await rm(sourcePath, { force: true });
    await rename(temporary, replacement);
  } catch (error) {
    await rm(temporary, { force: true });
    if (await pathExists(archivePath) && !(await pathExists(sourcePath))) await copyFile(archivePath, sourcePath);
    throw error;
  }
  await pruneHistory(path.join(root, ".credentials", "archive"), `${name}-${keyId}`, SLOT_HISTORY_LIMIT);
  await updateSlotManifest(root, name, (manifest) => appendSlotAudit({ ...manifest, slots: { ...manifest.slots, [keyId]: { ...(manifest.slots[keyId] ?? { keyId, createdAt: new Date().toISOString() }), keyId, storage, status: "active", rotatedAt: new Date().toISOString() } } }, { action: "rotated", keyId, storage, at: new Date().toISOString() }));
  return { ...plan, dryRun: false, rotated: true, archived: archive, credentialStored: path.relative(root, replacement), vaultVersion: storage === "encrypted" ? VAULT_SCHEMA_VERSION : null };
}

export async function removeCredential(root, name, { dryRun = true, keyId = "primary", nextKeyId = null } = {}) {
  validateKeyId(keyId);
  if (nextKeyId !== null) validateKeyId(nextKeyId);
  const status = await credentialStatus(root, name, { keyId });
  if (!status.configured || ["process-environment", "legacy-dotenv"].includes(status.source)) return { credential: name, dryRun, removed: false, manualRequired: status.configured, message: status.configured ? "Remove the credential through its owning environment or secret manager." : "Credential is not configured." };
  const source = credentialPath(name, keyId, status.source === "encrypted-local-secret" ? "encrypted" : "local");
  const quarantine = slotArchivePath(name, keyId, source, "removed");
  const active = status.activeKeyId === keyId;
  const available = (await listCredentialKeys(root, name)).filter((slot) => slot.keyId !== keyId && slot.status === "active");
  if (active && available.length && !nextKeyId) return { credential: name, keyId, dryRun, removed: false, requiresNextKeyId: true, availableKeyIds: available.map((slot) => slot.keyId), message: "Select --next-key-id before quarantining the active slot." };
  if (nextKeyId && !available.some((slot) => slot.keyId === nextKeyId)) throw new Error(`Replacement key slot ${nextKeyId} is not active.`);
  if (dryRun) return { credential: name, keyId, dryRun: true, move: { from: source, to: quarantine }, nextKeyId, destructiveDelete: false };
  await mkdir(path.join(root, path.dirname(quarantine)), { recursive: true });
  await rename(path.join(root, source), path.join(root, quarantine));
  await updateSlotManifest(root, name, (manifest) => {
    const now = new Date().toISOString();
    const slots = { ...manifest.slots, [keyId]: { ...(manifest.slots[keyId] ?? { keyId }), status: "quarantined", removedAt: now, recoveryExpiresAt: new Date(Date.now() + SLOT_RETENTION_DAYS * 86_400_000).toISOString() } };
    return appendSlotAudit({ ...manifest, activeKeyId: active ? (nextKeyId ?? null) : manifest.activeKeyId, slots }, { action: "quarantined", keyId, at: now });
  });
  return { credential: name, keyId, dryRun: false, removed: true, quarantined: quarantine, destructiveDelete: false };
}

export async function backupCredentials(root, { dryRun = true } = {}) {
  const entries = await Promise.all(Object.keys(CREDENTIAL_DEFINITIONS).map(async (name) => ({ name, keys: await listCredentialKeys(root, name) })));
  const managed = entries.flatMap(({ name, keys }) => keys.filter(({ status }) => status === "active").map((slot) => ({ credential: name, keyId: slot.keyId, storage: slot.storage, source: credentialPath(name, slot.keyId, slot.storage) })));
  const backupRoot = path.join(".credentials", "backups", new Date().toISOString().replace(/[:.]/g, "-"));
  if (dryRun) return {
    dryRun: true,
    credentials: managed.map(({ credential, storage }) => ({ credential, source: storage === "encrypted" ? "encrypted-local-secret" : "workspace-local-secret" })),
    slots: managed.map(({ credential, keyId, source }) => ({ credential, keyId, source })),
    backupRoot,
    containsSecrets: true,
  };
  await mkdir(path.join(root, backupRoot), { recursive: true });
  for (const entry of managed) {
    await copyFile(path.join(root, entry.source), path.join(root, backupRoot, `${entry.credential}-${entry.keyId}${path.extname(entry.source)}`));
  }
  return { dryRun: false, backedUp: managed.map(({ credential, keyId }) => ({ credential, keyId })), backupRoot, containsSecrets: true };
}

export async function auditCredentialVault(root) {
  const credentials = [];
  for (const name of Object.keys(CREDENTIAL_DEFINITIONS)) {
    const target = path.join(root, ".credentials", `${name}.enc.json`);
    if (!(await pathExists(target))) continue;
    try {
      const payload = JSON.parse(await readFile(target, "utf8"));
      const metadata = payload.protected ? JSON.parse(Buffer.from(payload.protected, "base64").toString("utf8")) : { variable: payload.variable, credentialVersion: 1 };
      if (payload.schemaVersion === 1) {
        credentials.push({ credential: name, valid: false, schemaVersion: 1, algorithm: payload.algorithm, kdf: "legacy-sha256", credentialVersion: 1, migrationRequired: true, issue: `Run forgevena vault migrate ${name} --apply --yes.`, secretReturned: false });
        continue;
      }
      await readEncryptedCredential(target, credentialVariable(name));
      credentials.push({ credential: name, valid: true, schemaVersion: payload.schemaVersion, algorithm: payload.algorithm, kdf: payload.kdf?.name, credentialVersion: metadata.credentialVersion ?? 1, migrationRequired: false, secretReturned: false });
    } catch (error) { credentials.push({ credential: name, valid: false, issue: error.message, secretReturned: false }); }
  }
  return { schemaVersion: VAULT_SCHEMA_VERSION, healthy: credentials.every((entry) => entry.valid), credentials, secretValuesReturned: false };
}

export async function migrateLegacyCredential(root, name, { dryRun = true, yes = false } = {}) {
  const variable = credentialVariable(name);
  const target = path.join(root, ".credentials", `${name}.enc.json`);
  if (!(await pathExists(target))) return { credential: name, dryRun, migrated: false, skipped: true, message: "No encrypted credential exists." };
  const payload = JSON.parse(await readFile(target, "utf8"));
  if (payload.schemaVersion !== 1) return { credential: name, dryRun, migrated: false, skipped: true, schemaVersion: payload.schemaVersion, message: "Credential already uses the current vault schema." };
  const backup = path.join(root, ".credentials", "legacy", `${name}-${Date.now()}.enc.json`);
  const plan = {
    credential: name,
    dryRun,
    fromSchemaVersion: 1,
    toSchemaVersion: VAULT_SCHEMA_VERSION,
    backup: path.relative(root, backup),
    destination: path.relative(root, target),
    requiresExplicitConsent: true,
    legacyKdf: "sha256",
    replacementKdf: "argon2id-with-pbkdf2-fallback",
  };
  if (dryRun) return plan;
  if (!yes) throw new Error("Legacy vault migration requires --apply --yes because it decrypts and re-encrypts credential material.");
  const secret = decryptLegacyCredential(payload, variable);
  const replacement = await encryptCredential(variable, secret, { previousVersion: 1 });
  const temporary = `${target}.${Date.now()}.migration`;
  await mkdir(path.dirname(backup), { recursive: true });
  await writeFile(temporary, replacement, { encoding: "utf8", mode: 0o600, flag: "wx" });
  try {
    await copyFile(target, backup, constants.COPYFILE_EXCL);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return { ...plan, dryRun: false, migrated: true, schemaVersion: VAULT_SCHEMA_VERSION, secretReturned: false };
}

export async function listCredentialKeys(root, name, { manifest = null } = {}) {
  credentialVariable(name);
  const resolved = manifest ?? await readSlotManifest(root, name);
  const slots = { ...resolved.slots };
  for (const storage of ["encrypted", "local"]) {
    const target = path.join(root, credentialPath(name, "primary", storage));
    if (await pathExists(target)) slots.primary ??= { keyId: "primary", storage, status: "active", createdAt: null, rotatedAt: null, validatedAt: null };
  }
  return Object.values(slots).map((slot) => ({
    keyId: slot.keyId,
    storage: slot.storage ?? "local",
    status: slot.status ?? "active",
    active: resolved.activeKeyId === slot.keyId,
    createdAt: slot.createdAt ?? null,
    rotatedAt: slot.rotatedAt ?? null,
    validatedAt: slot.validatedAt ?? null,
    recoveryExpiresAt: slot.recoveryExpiresAt ?? null,
    secretReturned: false,
  })).sort((left, right) => left.keyId.localeCompare(right.keyId));
}

export async function credentialKeyAudit(root, name) {
  credentialVariable(name);
  const manifest = await readSlotManifest(root, name);
  return { schemaVersion: SLOT_SCHEMA_VERSION, credential: name, activeKeyId: manifest.activeKeyId ?? "primary", audit: manifest.audit.map(({ action, keyId, storage, at }) => ({ action, keyId, storage: storage ?? null, at })), secretValuesReturned: false };
}

export async function activateCredentialKey(root, name, keyId, { dryRun = true } = {}) {
  validateKeyId(keyId);
  const status = await credentialStatus(root, name, { keyId });
  if (status.source === "process-environment") return { credential: name, keyId, dryRun, activated: false, manualRequired: true, message: "The process environment overrides managed key selection. Change the owning environment or restart without it." };
  if (!status.configured || status.source === "legacy-dotenv") return { credential: name, keyId, dryRun, activated: false, message: "Only an active managed key slot can be selected." };
  const plan = { credential: name, keyId, dryRun, previousKeyId: status.activeKeyId, activeKeyId: keyId };
  if (dryRun) return plan;
  await updateSlotManifest(root, name, (manifest) => appendSlotAudit({ ...manifest, activeKeyId: keyId }, { action: "activated", keyId, at: new Date().toISOString() }));
  return { ...plan, dryRun: false, activated: true };
}

export async function recoverCredential(root, name, { dryRun = true, keyId = "primary" } = {}) {
  credentialVariable(name);
  validateKeyId(keyId);
  await cleanupExpiredQuarantine(root, name);
  const manifest = await readSlotManifest(root, name);
  const active = path.join(root, credentialPath(name, keyId, manifest.slots[keyId]?.storage ?? "encrypted"));
  if (await pathExists(active)) return { credential: name, keyId, dryRun, recovered: false, skipped: true, message: "An active managed credential exists and was not overwritten." };
  const candidates = await archivedSlotCandidates(root, name, keyId);
  if (!candidates.length) return { credential: name, keyId, dryRun, recovered: false, message: "No managed rotation or quarantine history is available." };
  const source = candidates[0];
  const storage = source.endsWith(".json") ? "encrypted" : "local";
  if (storage === "encrypted") await readEncryptedCredential(source, credentialVariable(name));
  else if (!await readVariable(source, credentialVariable(name))) throw new Error("Recovered local credential is empty or unreadable.");
  const destination = path.join(root, credentialPath(name, keyId, storage));
  const plan = { credential: name, keyId, dryRun, source: path.relative(root, source), destination: path.relative(root, destination), integrityValidated: true, overwrite: false };
  if (dryRun) return plan;
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination, constants.COPYFILE_EXCL);
  await updateSlotManifest(root, name, (current) => appendSlotAudit({ ...current, activeKeyId: current.activeKeyId ?? keyId, slots: { ...current.slots, [keyId]: { ...(current.slots[keyId] ?? { keyId }), keyId, storage, status: "active", recoveryExpiresAt: null } } }, { action: "recovered", keyId, storage, at: new Date().toISOString() }));
  return { ...plan, dryRun: false, recovered: true };
}

function credentialVariable(name) {
  const variable = CREDENTIAL_DEFINITIONS[name];
  if (!variable) throw new Error(`Choose one of: ${Object.keys(CREDENTIAL_DEFINITIONS).join(", ")}.`);
  return variable;
}
function validateKeyId(keyId) {
  if (typeof keyId !== "string" || !SLOT_ID_PATTERN.test(keyId)) throw new Error("Credential key IDs must use lowercase letters, numbers, and hyphens, start with a letter, and be at most 32 characters.");
  return keyId;
}
function credentialPath(name, keyId, storage) {
  if (keyId === "primary") return storage === "encrypted" ? path.join(".credentials", `${name}.enc.json`) : path.join(SECRET_DIRECTORY, `${name}.env`);
  return storage === "encrypted" ? path.join(".credentials", "slots", name, `${keyId}.enc.json`) : path.join(SECRET_DIRECTORY, `${name}.slots`, `${keyId}.env`);
}
function slotManifestPath(name) { return path.join(SECRET_DIRECTORY, `${name}.slots.json`); }
function slotArchivePath(name, keyId, source, directory) { return path.join(".credentials", directory, `${name}-${keyId}-${Date.now()}${path.extname(source)}`); }
function emptySlotManifest(name) { return { schemaVersion: SLOT_SCHEMA_VERSION, credential: name, activeKeyId: "primary", slots: {}, audit: [] }; }
async function readSlotManifest(root, name) {
  const target = path.join(root, slotManifestPath(name));
  try {
    const value = JSON.parse(await readFile(target, "utf8"));
    if (value.schemaVersion !== SLOT_SCHEMA_VERSION || value.credential !== name || typeof value.slots !== "object" || !Array.isArray(value.audit)) throw new Error("Credential slot metadata is invalid.");
    if (value.activeKeyId !== null) validateKeyId(value.activeKeyId ?? "primary");
    return { ...emptySlotManifest(name), ...value, slots: { ...value.slots }, audit: value.audit.slice(-SLOT_AUDIT_LIMIT) };
  } catch (error) { if (error?.code === "ENOENT") return emptySlotManifest(name); throw error; }
}
async function updateSlotManifest(root, name, transform) {
  const target = path.join(root, slotManifestPath(name));
  const current = await readSlotManifest(root, name);
  const next = transform(current);
  const temporary = `${target}.${Date.now()}.tmp`;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  await rename(temporary, target);
  return next;
}
function appendSlotAudit(manifest, event) { return { ...manifest, schemaVersion: SLOT_SCHEMA_VERSION, credential: manifest.credential, audit: [...manifest.audit, event].slice(-SLOT_AUDIT_LIMIT) }; }
async function storageForSlot(root, name, keyId) {
  if (await pathExists(path.join(root, credentialPath(name, keyId, "encrypted")))) return "encrypted-local-secret";
  if (await pathExists(path.join(root, credentialPath(name, keyId, "local")))) return "workspace-local-secret";
  return null;
}
async function archivedSlotCandidates(root, name, keyId) {
  const archives = [];
  const quarantined = [];
  for (const directory of ["removed", "archive"]) {
    const target = path.join(root, ".credentials", directory);
    try {
      for (const entry of await readdir(target)) {
        const legacyPrimary = keyId === "primary" && new RegExp(`^${name}-\\d`).test(entry);
        if (!entry.startsWith(`${name}-${keyId}-`) && !legacyPrimary) continue;
        (directory === "archive" ? archives : quarantined).push(path.join(target, entry));
      }
    }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  return archives.sort().reverse().concat(quarantined.sort().reverse());
}
async function cleanupExpiredQuarantine(root, name) {
  const manifest = await readSlotManifest(root, name);
  const expired = Object.values(manifest.slots).filter((slot) => slot.status === "quarantined" && slot.recoveryExpiresAt && Date.parse(slot.recoveryExpiresAt) <= Date.now());
  if (!expired.length) return [];
  const removedDirectory = path.join(root, ".credentials", "removed");
  for (const slot of expired) {
    try { for (const entry of await readdir(removedDirectory)) if (entry.startsWith(`${name}-${slot.keyId}-`)) await rm(path.join(removedDirectory, entry), { force: true }); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  await updateSlotManifest(root, name, (current) => {
    const slots = { ...current.slots };
    for (const slot of expired) slots[slot.keyId] = { ...slots[slot.keyId], status: "purged", recoveryExpiresAt: null };
    return appendSlotAudit({ ...current, slots }, { action: "quarantine-expired", keyId: null, at: new Date().toISOString() });
  });
  return expired.map((slot) => slot.keyId);
}
async function readManagedSlot(root, name, keyId, source) {
  const variable = credentialVariable(name);
  if (source === "encrypted-local-secret") return readEncryptedCredential(path.join(root, credentialPath(name, keyId, "encrypted")), variable);
  if (source === "workspace-local-secret") return readVariable(path.join(root, credentialPath(name, keyId, "local")), variable);
  if (source === "legacy-dotenv") return readVariable(path.join(root, ".env"), variable);
  return null;
}
async function legacyEnvironmentContains(root, variable) { return Boolean(await readVariable(path.join(root, ".env"), variable)); }
async function readVariable(target, variable) {
  try {
    const line = (await readFile(target, "utf8")).split(/\r?\n/).find((entry) => entry.startsWith(`${variable}=`));
    return line?.slice(variable.length + 1).trim() || null;
  } catch { return null; }
}
async function pathExists(target) { try { await access(target); return true; } catch { return false; } }
function vaultPassphrase() {
  const passphrase = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  if (!passphrase) throw new Error("Encrypted credential storage requires AI_WORKSPACE_CREDENTIAL_KEY from an OS credential store or approved secret manager.");
  return passphrase;
}
async function encryptCredential(variable, secret, { previousVersion = null } = {}) {
  const salt = randomBytes(16);
  const { key, metadata } = await deriveEncryptionKey(vaultPassphrase(), salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const protectedMetadata = Buffer.from(JSON.stringify({ variable, credentialVersion: (previousVersion ?? 0) + 1 }), "utf8");
  cipher.setAAD(protectedMetadata);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${JSON.stringify({ schemaVersion: VAULT_SCHEMA_VERSION, algorithm: "aes-256-gcm", kdf: metadata, salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), protected: protectedMetadata.toString("base64"), ciphertext: ciphertext.toString("base64") }, null, 2)}\n`;
}
async function readEncryptedCredential(target, variable) {
  try {
    const payload = JSON.parse(await readFile(target, "utf8"));
    if (payload.algorithm !== "aes-256-gcm") throw new Error("Encrypted credential metadata is invalid.");
    if (payload.schemaVersion === 1) throw new Error("Legacy encrypted credential requires explicit migration with: forgevena vault migrate <credential> --apply --yes.");
    if (payload.schemaVersion !== VAULT_SCHEMA_VERSION) throw new Error(`Unsupported credential vault schema version: ${payload.schemaVersion}.`);
    const protectedMetadata = Buffer.from(payload.protected, "base64");
    const metadata = JSON.parse(protectedMetadata.toString("utf8"));
    if (metadata.variable !== variable || !Number.isInteger(metadata.credentialVersion)) throw new Error("Encrypted credential protected metadata is invalid.");
    const { key } = await deriveEncryptionKey(vaultPassphrase(), Buffer.from(payload.salt, "base64"), payload.kdf);
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"), {
      authTagLength: 16
    });
    decipher.setAAD(protectedMetadata);
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}
async function deriveEncryptionKey(passphrase, salt, requested) {
  if (!requested || requested.name === "argon2id") {
    try {
      const parameters = { memoryCost: requested?.memoryCost ?? 65_536, timeCost: requested?.timeCost ?? 3, parallelism: requested?.parallelism ?? 1, outputLen: 32, algorithm: Algorithm.Argon2id, salt };
      return { key: await hashRaw(passphrase, parameters), metadata: { name: "argon2id", memoryCost: parameters.memoryCost, timeCost: parameters.timeCost, parallelism: parameters.parallelism, outputLength: 32 } };
    } catch (error) {
      if (requested?.name === "argon2id") throw new Error(`Argon2id key derivation failed: ${error.message}`);
    }
  }
  const iterations = requested?.iterations ?? PBKDF2_ITERATIONS;
  return { key: await derivePbkdf2(passphrase, salt, iterations, 32, "sha256"), metadata: { name: "pbkdf2-sha256", iterations, outputLength: 32 } };
}
function decryptLegacyCredential(payload, variable) {
  if (payload.variable !== variable) throw new Error("Encrypted credential metadata is invalid.");
  // lgtm[js/insufficient-password-hash] Compatibility-only decryption is consent-gated and immediately re-encrypted with Argon2id.
  const legacyKey = createHash("sha256").update(vaultPassphrase()).digest();
  const decipher = createDecipheriv("aes-256-gcm", legacyKey, Buffer.from(payload.iv, "base64"), {
    authTagLength: 16
  });
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8");
}
async function credentialVersion(target) {
  try {
    const payload = JSON.parse(await readFile(target, "utf8"));
    if (payload.schemaVersion !== VAULT_SCHEMA_VERSION || !payload.protected) return 1;
    return JSON.parse(Buffer.from(payload.protected, "base64").toString("utf8")).credentialVersion ?? 1;
  } catch { return 0; }
}
async function pruneHistory(directory, name, limit) {
  try {
    const entries = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.startsWith(`${name}-`)).map((entry) => entry.name).sort().reverse();
    await Promise.all(entries.slice(limit).map((entry) => rm(path.join(directory, entry), { force: true })));
  } catch (error) { if (error?.code !== "ENOENT") throw error; }
}
