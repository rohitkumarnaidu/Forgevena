import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listCredentialDefinitions, credentialStatus } from "./credentials.js";
import { readProjectProviderConfig, configureProjectProviders } from "./provider-project.js";

export async function exportSafeConfiguration(root, output, { dryRun = true } = {}) {
  const relative = output ?? path.join(".ai-workspace", "exports", "configuration.json");
  const target = path.resolve(root, relative);
  assertInside(root, target);
  const exists = await pathExists(target);
  const bundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    providerConfiguration: await readProjectProviderConfig(root),
    credentialReferences: await Promise.all(listCredentialDefinitions().map(async ({ name, environmentVariable }) => ({ name, environmentVariable, configured: (await credentialStatus(root, name)).configured }))),
    containsSecrets: false,
  };
  const plan = { dryRun, path: path.relative(root, target), create: exists ? [] : [path.relative(root, target)], skipped: exists ? [path.relative(root, target)] : [], containsSecrets: false, bundle };
  if (dryRun || exists) return plan;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(bundle, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return { ...plan, dryRun: false, exported: true, bundle: undefined };
}

export async function importSafeConfiguration(root, input, { dryRun = true } = {}) {
  if (!input) throw new Error("Use --input <configuration.json>.");
  const target = path.resolve(root, input);
  assertInside(root, target);
  const bundle = JSON.parse(await readFile(target, "utf8"));
  rejectSensitiveFields(bundle);
  if (bundle.schemaVersion !== 1 || bundle.containsSecrets !== false || !bundle.providerConfiguration) throw new Error("Unsupported or unsafe configuration bundle.");
  const projectTarget = path.join(root, ".ai-workspace", "providers", "project.json");
  const exists = await pathExists(projectTarget);
  const plan = { dryRun, input: path.relative(root, target), create: exists ? [] : [path.relative(root, projectTarget)], skipped: exists ? [path.relative(root, projectTarget)] : [], importsCredentials: false };
  if (dryRun || exists) return plan;
  const result = await configureProjectProviders(root, bundle.providerConfiguration, { dryRun: false });
  return { ...plan, dryRun: false, imported: result.configured, importsCredentials: false };
}

function rejectSensitiveFields(value, trail = []) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    const next = [...trail, key];
    if (/secret|password|api.?key|ciphertext|private.?key|^(?:token|accessToken|authToken)$/i.test(key) && key !== "containsSecrets") throw new Error(`Unsafe configuration field: ${next.join(".")}.`);
    rejectSensitiveFields(nested, next);
  }
}
function assertInside(root, target) { const relative = path.relative(path.resolve(root), target); if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Configuration paths must remain inside the project."); }
async function pathExists(target) { try { await access(target); return true; } catch { return false; } }
