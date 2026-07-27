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

export async function configureCredential(root, name, secret, { dryRun = true, storage = "local" } = {}) {
  const environmentVariable = credentialVariable(name);
  if (!["local", "encrypted"].includes(storage)) throw new Error("Credential storage must be local or encrypted.");
  const relative = storage === "encrypted" ? path.join(".credentials", `${name}.enc.json`) : path.join(SECRET_DIRECTORY, `${name}.env`);
  const target = path.join(root, relative);
  const exists = await pathExists(target);
  const plan = {
    credential: name,
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
  return { ...plan, dryRun: false, configured: true, credentialStored: relative };
}

export async function credentialStatus(root, name) {
  const environmentVariable = credentialVariable(name);
  const source = process.env[environmentVariable]
    ? "process-environment"
    : await pathExists(path.join(root, ".credentials", `${name}.enc.json`))
      ? "encrypted-local-secret"
    : await pathExists(path.join(root, SECRET_DIRECTORY, `${name}.env`))
      ? "workspace-local-secret"
      : await legacyEnvironmentContains(root, environmentVariable)
        ? "legacy-dotenv"
        : null;
  return { credential: name, environmentVariable, configured: Boolean(source), source };
}

export async function readCredential(root, nameOrVariable) {
  const entry = Object.entries(CREDENTIAL_DEFINITIONS).find(([name, variable]) => name === nameOrVariable || variable === nameOrVariable);
  if (!entry) throw new Error(`Unknown credential: ${nameOrVariable}.`);
  const [name, environmentVariable] = entry;
  if (process.env[environmentVariable]) return process.env[environmentVariable];
  const encrypted = await readEncryptedCredential(path.join(root, ".credentials", `${name}.enc.json`), environmentVariable);
  if (encrypted) return encrypted;
  const managed = await readVariable(path.join(root, SECRET_DIRECTORY, `${name}.env`), environmentVariable);
  return managed || await readVariable(path.join(root, ".env"), environmentVariable);
}

export async function validateCredential(root, name) {
  const status = await credentialStatus(root, name);
  if (!status.configured) return { ...status, valid: false, issues: ["Credential is not configured."] };
  try { const value = await readCredential(root, name); return { ...status, valid: Boolean(value?.trim()), issues: value?.trim() ? [] : ["Credential value is empty or unreadable."] }; }
  catch (error) { return { ...status, valid: false, issues: [error.message] }; }
}

export async function rotateCredential(root, name, secret, { dryRun = true, storage = "local" } = {}) {
  const status = await credentialStatus(root, name);
  if (!status.configured || ["process-environment", "legacy-dotenv"].includes(status.source)) return { credential: name, dryRun, rotated: false, manualRequired: true, message: "Only workspace-managed credentials can be rotated. Rotate external credentials through their owning secret manager." };
  const source = status.source === "encrypted-local-secret" ? path.join(".credentials", `${name}.enc.json`) : path.join(SECRET_DIRECTORY, `${name}.env`);
  const archive = path.join(".credentials", "archive", `${name}-${Date.now()}${path.extname(source)}`);
  const plan = { credential: name, dryRun, move: { from: source, to: archive }, replacementStorage: storage, secretReturned: false };
  if (dryRun) return plan;
  if (!secret?.trim()) throw new Error("A non-empty replacement credential is required.");
  const sourcePath = path.join(root, source);
  const archivePath = path.join(root, archive);
  const replacement = storage === "encrypted" ? path.join(root, ".credentials", `${name}.enc.json`) : path.join(root, SECRET_DIRECTORY, `${name}.env`);
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
  await pruneHistory(path.join(root, ".credentials", "archive"), name, 5);
  return { ...plan, dryRun: false, rotated: true, archived: archive, credentialStored: path.relative(root, replacement), vaultVersion: storage === "encrypted" ? VAULT_SCHEMA_VERSION : null };
}

export async function removeCredential(root, name, { dryRun = true } = {}) {
  const status = await credentialStatus(root, name);
  if (!status.configured || ["process-environment", "legacy-dotenv"].includes(status.source)) return { credential: name, dryRun, removed: false, manualRequired: status.configured, message: status.configured ? "Remove the credential through its owning environment or secret manager." : "Credential is not configured." };
  const source = status.source === "encrypted-local-secret" ? path.join(".credentials", `${name}.enc.json`) : path.join(SECRET_DIRECTORY, `${name}.env`);
  const quarantine = path.join(".credentials", "removed", `${name}-${Date.now()}${path.extname(source)}`);
  if (dryRun) return { credential: name, dryRun: true, move: { from: source, to: quarantine }, destructiveDelete: false };
  await mkdir(path.join(root, path.dirname(quarantine)), { recursive: true });
  await rename(path.join(root, source), path.join(root, quarantine));
  return { credential: name, dryRun: false, removed: true, quarantined: quarantine, destructiveDelete: false };
}

export async function backupCredentials(root, { dryRun = true } = {}) {
  const entries = await Promise.all(Object.keys(CREDENTIAL_DEFINITIONS).map((name) => credentialStatus(root, name)));
  const managed = entries.filter(({ source }) => ["workspace-local-secret", "encrypted-local-secret"].includes(source));
  const backupRoot = path.join(".credentials", "backups", new Date().toISOString().replace(/[:.]/g, "-"));
  if (dryRun) return { dryRun: true, credentials: managed.map(({ credential, source }) => ({ credential, source })), backupRoot, containsSecrets: true };
  await mkdir(path.join(root, backupRoot), { recursive: true });
  for (const entry of managed) {
    const source = entry.source === "encrypted-local-secret" ? path.join(".credentials", `${entry.credential}.enc.json`) : path.join(SECRET_DIRECTORY, `${entry.credential}.env`);
    await copyFile(path.join(root, source), path.join(root, backupRoot, path.basename(source)));
  }
  return { dryRun: false, backedUp: managed.map(({ credential }) => credential), backupRoot, containsSecrets: true };
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

export async function recoverCredential(root, name, { dryRun = true } = {}) {
  credentialVariable(name);
  const active = path.join(root, ".credentials", `${name}.enc.json`);
  if (await pathExists(active)) return { credential: name, dryRun, recovered: false, skipped: true, message: "An active encrypted credential exists and was not overwritten." };
  const archiveDirectory = path.join(root, ".credentials", "archive");
  let candidates = [];
  try { candidates = (await readdir(archiveDirectory)).filter((entry) => entry.startsWith(`${name}-`) && entry.endsWith(".json")).sort().reverse(); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  if (!candidates.length) return { credential: name, dryRun, recovered: false, message: "No encrypted rotation history is available." };
  const source = path.join(archiveDirectory, candidates[0]);
  await readEncryptedCredential(source, credentialVariable(name));
  const plan = { credential: name, dryRun, source: path.relative(root, source), destination: path.relative(root, active), integrityValidated: true, overwrite: false };
  if (dryRun) return plan;
  await mkdir(path.dirname(active), { recursive: true });
  await copyFile(source, active, constants.COPYFILE_EXCL);
  return { ...plan, dryRun: false, recovered: true };
}

function credentialVariable(name) {
  const variable = CREDENTIAL_DEFINITIONS[name];
  if (!variable) throw new Error(`Choose one of: ${Object.keys(CREDENTIAL_DEFINITIONS).join(", ")}.`);
  return variable;
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
