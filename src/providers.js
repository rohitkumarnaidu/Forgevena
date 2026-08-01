import { access, mkdir, writeFile } from "node:fs/promises";
import { PLATFORM_VERSION } from "./version.js";
import path from "node:path";
import { PROVIDER_DEFINITIONS, providerDefinition, providerRuntimeStatus } from "./provider-runtime.js";
import { configureCredential, readCredential } from "./credentials.js";
import { readStateDocument, updateStateDocument } from "./state-documents.js";
import { ProviderRegistry, profileFromDefinition } from "./provider-registry.js";
import { readProviderPolicy } from "./provider-policy.js";

const providerMetadata = {
  claude: { host: "Claude Code or Anthropic API", mcp: "Configure MCP through the selected host after reviewing its permissions." },
  codex: { host: "Codex CLI or OpenAI API", mcp: "Configure MCP through Codex after reviewing server permissions." },
  cursor: { host: "Cursor", mcp: "Configure provider or MCP settings in Cursor; workspace stores no credential." },
  gemini: { host: "Gemini API", mcp: "Configure MCP through the selected Gemini-compatible host." },
  openai: { host: "OpenAI API", mcp: "Configure MCP through the selected OpenAI-compatible host." },
  openrouter: { host: "OpenRouter API", mcp: "Configure MCP through the selected agent host." },
  ollama: { host: "Local Ollama runtime", mcp: "Ollama runs locally and does not require an API credential." },
  windsurf: { host: "Windsurf", mcp: "Configure provider or MCP settings in Windsurf; workspace stores no credential." },
};

export function listProviderProfiles() { return Object.keys(PROVIDER_DEFINITIONS).map((name) => definition(name)); }

export async function initializeProviderProfile(root, name, { dryRun = true } = {}) {
  const definition = provider(name);
  const profilePath = path.join(".ai-workspace", "providers", `${name}.json`);
  const documentationPath = path.join("docs", "ai-providers", `${name}.md`);
  const profile = {
    schemaVersion: 1,
    provider: name,
    service: definition.service,
    kind: definition.kind,
    support: definition.support,
    capabilities: definition.capabilities,
    defaultModel: definition.defaultModel ?? null,
    allowedModels: [],
    endpointProfile: "default",
    credentialSource: definition.environmentVariable ? { type: "environment-variable", name: definition.environmentVariable } : { type: "host-managed", name: definition.host },
    mcp: { status: "manual-configuration-required", guidance: definition.mcp },
    storesSecrets: false,
    compatibilityEvidenceId: null,
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
  await new ProviderRegistry(root).registerProfile(profile);
  return { provider: name, dryRun: false, created: create.map((file) => file.relative), skipped: skipped.map((file) => file.relative), storesSecrets: false };
}

export async function configureProviderCredential(root, name, secret, { dryRun = true } = {}) {
  const definition = provider(name);
  if (!definition.environmentVariable) throw new Error(`${name} uses host-managed authentication. Configure it in ${definition.host}.`);
  const profilePath = path.join(root, ".ai-workspace", "providers", `${name}.json`);
  const profileExists = await exists(profilePath);
  const credentialPlan = await configureCredential(root, name, secret, { dryRun: true });
  const plan = { provider: name, dryRun, environmentVariable: definition.environmentVariable, create: [...credentialPlan.create, ...(profileExists ? [] : [path.join(".ai-workspace", "providers", `${name}.json`), path.join("docs", "ai-providers", `${name}.md`)])], skipped: credentialPlan.skipped, secretHandling: credentialPlan.secretHandling };
  if (dryRun) return plan;
  const result = await configureCredential(root, name, secret, { dryRun: false });
  if (!result.configured) return { ...plan, ...result, provider: name };
  if (!profileExists) await initializeProviderProfile(root, name, { dryRun: false });
  await updateRegistry(root, name, "configured-local-secret");
  return { ...plan, dryRun: false, configured: true, credentialStored: result.credentialStored, environmentVariable: definition.environmentVariable };
}

export async function providerStatus(root, name) {
  const registry = new ProviderRegistry(root);
  const names = name ? [name] : Object.keys(PROVIDER_DEFINITIONS);
  return Promise.all(names.map(async (providerName) => {
    const definition = provider(providerName);
    const runtime = await providerRuntimeStatus(root, providerName);
    const profilePath = path.join(root, ".ai-workspace", "providers", `${providerName}.json`);
    const compatibility = await registry.compatibility(providerName);
    const policy = await readProviderPolicy(root, providerName);
    const usage = policy.usage;
    const authentication = definition.environmentVariable ? (Boolean(await readCredential(root, definition.environmentVariable)) ? "ready" : "not-configured") : definition.kind === "local-model" ? "not-required" : runtime.executableAvailable ? "host-available" : "host-unavailable";
    return {
      provider: providerName,
      profile: await exists(profilePath),
      credentialReference: definition.environmentVariable ?? "host-managed",
      credentialAvailable: definition.environmentVariable ? Boolean(await readCredential(root, definition.environmentVariable)) : null,
      mcp: "manual-configuration-required",
      storesSecrets: false,
      runtime,
      compatibility,
      health: {
        authentication,
        discovery: definition.capabilities.includes("model-discovery") ? (runtime.healthy ? "healthy" : "unavailable") : "not-supported",
        invocation: runtime.healthy === false || runtime.executableAvailable === false ? "unavailable" : "not-tested",
        rateLimit: policy.mode === "budgeted" && usage.requests >= policy.monthlyRequestLimit ? "local-budget-exhausted" : "within-local-budget",
        compatibility: compatibility.freshness,
      },
    };
  }));
}

export async function removeProviderProfile(root, name, { dryRun = true } = {}) {
  provider(name);
  const registry = await readStateDocument(root, ".ai-workspace/workspace.json", null);
  if (!registry) return { provider: name, dryRun, removed: false, message: "Workspace registry is not initialized." };
  const registered = (registry.providerProfiles ?? []).includes(name);
  const plan = { provider: name, dryRun, registered, registryOnly: true, profileFilesPreserved: true };
  if (dryRun || !registered) return plan;
  registry.providerProfiles = registry.providerProfiles.filter((entry) => entry !== name);
  if (registry.providerCredentialStatus) delete registry.providerCredentialStatus[name];
  registry.updatedAt = new Date().toISOString();
  await updateStateDocument(root, ".ai-workspace/workspace.json", () => registry, registry);
  await new ProviderRegistry(root).unregisterProfile(name);
  return { ...plan, dryRun: false, removed: true };
}

function definition(name) {
  const runtime = providerDefinition(name);
  const profile = profileFromDefinition(name);
  return { name, ...providerMetadata[name], service: profile.service, support: profile.support, environmentVariable: runtime.credential, kind: runtime.kind, capabilities: runtime.capabilities, defaultModel: runtime.defaultModel ?? null, storesSecrets: false };
}
function provider(name) { return definition(name); }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function updateRegistry(root, name, credentialStatus = "reference-only") {
  await updateStateDocument(root, ".ai-workspace/workspace.json", (registry) => ({ ...registry, providerProfiles: [...new Set([...(registry.providerProfiles ?? []), name])].sort(), providerCredentialStatus: { ...(registry.providerCredentialStatus ?? {}), [name]: credentialStatus }, updatedAt: new Date().toISOString() }), { initialized: true, workspaceVersion: PLATFORM_VERSION, schemaVersion: 2, modules: [], integrations: {} });
}
