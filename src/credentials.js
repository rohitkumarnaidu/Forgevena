import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { access, copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

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
  const contents = storage === "encrypted" ? encryptCredential(environmentVariable, secret.trim()) : `${environmentVariable}=${secret.trim()}\n`;
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
  await mkdir(path.join(root, path.dirname(archive)), { recursive: true });
  await rename(path.join(root, source), path.join(root, archive));
  const configured = await configureCredential(root, name, secret, { dryRun: false, storage });
  return { ...plan, dryRun: false, rotated: configured.configured, archived: archive, credentialStored: configured.credentialStored };
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
function encryptionKey() {
  const passphrase = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  if (!passphrase) throw new Error("Encrypted credential storage requires AI_WORKSPACE_CREDENTIAL_KEY from an OS credential store or approved secret manager.");
  return createHash("sha256").update(passphrase).digest();
}
function encryptCredential(variable, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${JSON.stringify({ schemaVersion: 1, variable, algorithm: "aes-256-gcm", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") }, null, 2)}\n`;
}
async function readEncryptedCredential(target, variable) {
  try {
    const payload = JSON.parse(await readFile(target, "utf8"));
    if (payload.variable !== variable || payload.algorithm !== "aes-256-gcm") throw new Error("Encrypted credential metadata is invalid.");
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}
