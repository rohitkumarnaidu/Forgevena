import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const providers = {
  claude: { environmentVariable: "ANTHROPIC_API_KEY", host: "Claude Code or Anthropic API", mcp: "Configure MCP through the selected host after reviewing its permissions." },
  codex: { environmentVariable: "OPENAI_API_KEY", host: "Codex CLI or OpenAI API", mcp: "Configure MCP through Codex after reviewing server permissions." },
  cursor: { environmentVariable: null, host: "Cursor", mcp: "Configure provider or MCP settings in Cursor; workspace stores no credential." },
  gemini: { environmentVariable: "GEMINI_API_KEY", host: "Gemini API", mcp: "Configure MCP through the selected Gemini-compatible host." },
  openai: { environmentVariable: "OPENAI_API_KEY", host: "OpenAI API", mcp: "Configure MCP through the selected OpenAI-compatible host." },
  openrouter: { environmentVariable: "OPENROUTER_API_KEY", host: "OpenRouter API", mcp: "Configure MCP through the selected agent host." },
  windsurf: { environmentVariable: null, host: "Windsurf", mcp: "Configure provider or MCP settings in Windsurf; workspace stores no credential." },
};

export function listProviderProfiles() { return Object.entries(providers).map(([name, value]) => ({ name, ...value, storesSecrets: false })); }

export async function initializeProviderProfile(root, name, { dryRun = true } = {}) {
  const definition = provider(name);
  const profilePath = path.join(".ai-workspace", "providers", `${name}.json`);
  const documentationPath = path.join("docs", "ai-providers", `${name}.md`);
  const profile = {
    provider: name,
    credentialSource: definition.environmentVariable ? { type: "environment-variable", name: definition.environmentVariable } : { type: "host-managed", name: definition.host },
    mcp: { status: "manual-configuration-required", guidance: definition.mcp },
    storesSecrets: false,
  };
  const files = [{ relative: profilePath, contents: `${JSON.stringify(profile, null, 2)}\n` }, { relative: documentationPath, contents: `# ${name} Provider\n\nCredential source: ${definition.environmentVariable ?? "managed by the provider host"}.\n\n${definition.mcp}\n\nNever add keys to this repository or workspace profile.\n` }];
  const create = [];
  const skipped = [];
  for (const file of files) ((await exists(path.join(root, file.relative))) ? skipped : create).push(file);
  if (dryRun) return { provider: name, dryRun: true, create: create.map((file) => file.relative), skipped: skipped.map((file) => file.relative), storesSecrets: false };
  for (const file of create) {
    const target = path.join(root, file.relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.contents, "utf8");
  }
  await updateRegistry(root, name);
  return { provider: name, dryRun: false, created: create.map((file) => file.relative), skipped: skipped.map((file) => file.relative), storesSecrets: false };
}

export async function configureProviderCredential(root, name, secret, { dryRun = true } = {}) {
  const definition = provider(name);
  if (!definition.environmentVariable) throw new Error(`${name} uses host-managed authentication. Configure it in ${definition.host}.`);
  const environmentPath = path.join(root, ".env");
  const profilePath = path.join(root, ".ai-workspace", "providers", `${name}.json`);
  const environmentExists = await exists(environmentPath);
  const profileExists = await exists(profilePath);
  const plan = { provider: name, dryRun, environmentVariable: definition.environmentVariable, create: [...(environmentExists ? [] : [".env"]), ...(profileExists ? [] : [path.join(".ai-workspace", "providers", `${name}.json`), path.join("docs", "ai-providers", `${name}.md`)])], skipped: environmentExists ? [".env"] : [], secretHandling: "The value is accepted only from an interactive masked prompt, written to a new local .env file, excluded by the generated .gitignore, and never logged or returned." };
  if (dryRun) return plan;
  if (!secret?.trim()) throw new Error("A non-empty provider key is required.");
  if (environmentExists) return { ...plan, dryRun: false, configured: false, manualRequired: true, message: ".env already exists and was not modified. Add the environment variable yourself to preserve existing configuration." };
  await mkdir(root, { recursive: true });
  await writeFile(environmentPath, `${definition.environmentVariable}=${secret.trim()}\n`, { encoding: "utf8", mode: 0o600 });
  if (!profileExists) await initializeProviderProfile(root, name, { dryRun: false });
  await updateRegistry(root, name, "configured-local-env");
  return { ...plan, dryRun: false, configured: true, credentialStored: "local .env", environmentVariable: definition.environmentVariable };
}

export async function providerStatus(root, name) {
  const names = name ? [name] : Object.keys(providers);
  return Promise.all(names.map(async (providerName) => {
    const definition = provider(providerName);
    const profilePath = path.join(root, ".ai-workspace", "providers", `${providerName}.json`);
    return {
      provider: providerName,
      profile: await exists(profilePath),
      credentialReference: definition.environmentVariable ?? "host-managed",
      credentialAvailable: definition.environmentVariable ? await credentialAvailable(root, definition.environmentVariable) : null,
      mcp: "manual-configuration-required",
      storesSecrets: false,
    };
  }));
}

function provider(name) { const definition = providers[name]; if (!definition) throw new Error(`Choose one of: ${Object.keys(providers).join(", ")}.`); return definition; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function credentialAvailable(root, environmentVariable) {
  if (process.env[environmentVariable]) return true;
  try { return new RegExp(`^${environmentVariable}=.+$`, "m").test(await readFile(path.join(root, ".env"), "utf8")); } catch { return false; }
}
async function updateRegistry(root, name, credentialStatus = "reference-only") {
  const registryPath = path.join(root, ".ai-workspace", "workspace.json");
  let registry;
  try { registry = JSON.parse(await readFile(registryPath, "utf8")); } catch { registry = { initialized: true, workspaceVersion: "0.1.0", modules: [], integrations: {} }; }
  registry.providerProfiles = [...new Set([...(registry.providerProfiles ?? []), name])].sort();
  registry.providerCredentialStatus = { ...(registry.providerCredentialStatus ?? {}), [name]: credentialStatus };
  registry.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(registryPath), { recursive: true });
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}
