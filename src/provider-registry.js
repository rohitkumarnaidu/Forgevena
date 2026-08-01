import path from "node:path";
import { randomUUID } from "node:crypto";
import { FileStateEngine } from "./state-engine.js";
import { PROVIDER_DEFINITIONS, providerDefinition } from "./provider-runtime.js";

export const PROVIDER_REGISTRY_SCHEMA_VERSION = 1;
export const PROVIDER_REGISTRY_PATH = path.join(".ai-workspace", "providers", "registry.json");
export const HOSTED_EVIDENCE_DAYS = 90;
export const LOCAL_EVIDENCE_DAYS = 180;

export class ProviderRegistryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ProviderRegistryError";
    this.code = code;
    this.details = details;
  }
}

export class ProviderRegistry {
  constructor(root, { state = new FileStateEngine(root), clock = () => new Date() } = {}) {
    this.root = root;
    this.state = state;
    this.clock = clock;
  }

  empty() { return { schemaVersion: PROVIDER_REGISTRY_SCHEMA_VERSION, profiles: {}, compatibilityEvidence: {}, updatedAt: this.clock().toISOString() }; }

  async read() { return this.state.read(PROVIDER_REGISTRY_PATH, { fallback: this.empty(), validate: validateProviderRegistry }); }

  async registerProfile(profile, { operationId = randomUUID() } = {}) {
    const normalized = validateProviderProfile(profile);
    return this.state.update(PROVIDER_REGISTRY_PATH, (registry) => ({ ...registry, profiles: { ...registry.profiles, [normalized.provider]: normalized }, updatedAt: this.clock().toISOString() }), { fallback: this.empty(), validate: validateProviderRegistry, operationId });
  }

  async unregisterProfile(provider, { operationId = randomUUID() } = {}) {
    return this.state.update(PROVIDER_REGISTRY_PATH, (registry) => {
      const profiles = { ...registry.profiles };
      delete profiles[provider];
      return { ...registry, profiles, updatedAt: this.clock().toISOString() };
    }, { fallback: this.empty(), validate: validateProviderRegistry, operationId });
  }

  async recordCompatibility(evidence, { operationId = randomUUID() } = {}) {
    const normalized = validateCompatibilityEvidence(evidence);
    return this.state.update(PROVIDER_REGISTRY_PATH, (registry) => ({ ...registry, compatibilityEvidence: { ...registry.compatibilityEvidence, [normalized.id]: normalized }, updatedAt: this.clock().toISOString() }), { fallback: this.empty(), validate: validateProviderRegistry, operationId });
  }

  async compatibility(provider, { requireCurrent = false } = {}) {
    const registry = await this.read();
    const records = Object.values(registry.compatibilityEvidence).filter((entry) => entry.provider === provider).sort((left, right) => Date.parse(right.verifiedAt) - Date.parse(left.verifiedAt));
    const evidence = records[0] ?? null;
    const freshness = evidence ? evidenceFreshness(evidence, this.clock()) : "missing";
    if (requireCurrent && freshness !== "current") throw new ProviderRegistryError("compatibility_stale", `Current compatibility evidence is required for ${provider}.`, { provider, evidenceId: evidence?.id ?? null, freshness });
    return { evidence, freshness, support: freshness === "current" ? evidence.support : freshness === "stale" ? "stale" : "unsupported" };
  }

  async migrationPlan({ legacyWorkspace = null, legacyProfiles = {} } = {}) {
    const current = await this.read();
    const names = new Set([...(legacyWorkspace?.providerProfiles ?? []), ...Object.keys(legacyProfiles)]);
    const additions = [];
    for (const name of names) {
      if (!PROVIDER_DEFINITIONS[name] || current.profiles[name]) continue;
      additions.push(profileFromDefinition(name, legacyProfiles[name]));
    }
    return { schemaVersion: 1, path: PROVIDER_REGISTRY_PATH, dryRun: true, additions, preservedUnknownProviders: [...names].filter((name) => !PROVIDER_DEFINITIONS[name]), current };
  }

  async migrate({ legacyWorkspace = null, legacyProfiles = {}, dryRun = true, operationId = randomUUID() } = {}) {
    const plan = await this.migrationPlan({ legacyWorkspace, legacyProfiles });
    if (dryRun || !plan.additions.length) return plan;
    await this.state.snapshot([PROVIDER_REGISTRY_PATH], { id: `providers-${operationId}` });
    const next = { ...plan.current, profiles: { ...plan.current.profiles }, updatedAt: this.clock().toISOString() };
    for (const profile of plan.additions) next.profiles[profile.provider] = profile;
    await this.state.write(PROVIDER_REGISTRY_PATH, next, { validate: validateProviderRegistry, operationId });
    return { ...plan, dryRun: false, migrated: plan.additions.map((entry) => entry.provider), registry: next };
  }
}

export function profileFromDefinition(name, overrides = {}) {
  const definition = providerDefinition(name);
  const stable = ["openai", "claude", "gemini", "openrouter", "ollama"].includes(name);
  return validateProviderProfile({
    schemaVersion: 1,
    provider: name,
    service: definition.service ?? (name === "claude" ? "Anthropic" : name),
    kind: definition.kind,
    support: stable ? "stable" : "compatibility-only",
    capabilities: [...definition.capabilities],
    defaultModel: definition.defaultModel ?? null,
    allowedModels: [],
    endpointProfile: definition.endpointProfile ?? "default",
    credentialSource: definition.credential ? { type: "credential-reference", name: definition.credential } : { type: "host-managed", name: definition.service ?? name },
    compatibilityEvidenceId: null,
    storesSecrets: false,
    ...overrides,
  });
}

export function validateProviderRegistry(value) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Registry must be an object."];
  if (value.schemaVersion !== PROVIDER_REGISTRY_SCHEMA_VERSION) issues.push("schemaVersion must be 1.");
  if (!value.profiles || typeof value.profiles !== "object" || Array.isArray(value.profiles)) issues.push("profiles must be an object.");
  else for (const [name, profile] of Object.entries(value.profiles)) { try { const normalized = validateProviderProfile(profile); if (normalized.provider !== name) issues.push(`Profile key ${name} does not match provider ${normalized.provider}.`); } catch (error) { issues.push(error.message); } }
  if (!value.compatibilityEvidence || typeof value.compatibilityEvidence !== "object" || Array.isArray(value.compatibilityEvidence)) issues.push("compatibilityEvidence must be an object.");
  else for (const evidence of Object.values(value.compatibilityEvidence)) { try { validateCompatibilityEvidence(evidence); } catch (error) { issues.push(error.message); } }
  if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) issues.push("updatedAt must be an ISO date.");
  return issues.length ? issues : true;
}

export function validateProviderProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProviderRegistryError("provider_profile_invalid", "Provider profile must be an object.");
  const provider = String(value.provider ?? "");
  if (!PROVIDER_DEFINITIONS[provider]) throw new ProviderRegistryError("provider_profile_invalid", `Unknown provider profile ${provider || "<empty>"}.`);
  if (value.storesSecrets !== false) throw new ProviderRegistryError("provider_profile_secret_forbidden", "Provider profiles must never store secrets.", { provider });
  if (!Array.isArray(value.capabilities)) throw new ProviderRegistryError("provider_profile_invalid", `Provider ${provider} capabilities must be an array.`);
  return { ...value, schemaVersion: 1, provider, service: String(value.service ?? provider), support: value.support ?? "compatibility-only", capabilities: [...new Set(value.capabilities.map(String))], allowedModels: [...new Set((value.allowedModels ?? []).map(String))], storesSecrets: false };
}

export function validateCompatibilityEvidence(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProviderRegistryError("compatibility_evidence_invalid", "Compatibility evidence must be an object.");
  for (const field of ["id", "provider", "verifiedAt", "expiresAt"]) if (!value[field]) throw new ProviderRegistryError("compatibility_evidence_invalid", `Compatibility evidence requires ${field}.`);
  if (!PROVIDER_DEFINITIONS[value.provider]) throw new ProviderRegistryError("compatibility_evidence_invalid", `Unknown provider ${value.provider}.`);
  if (Number.isNaN(Date.parse(value.verifiedAt)) || Number.isNaN(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.parse(value.verifiedAt)) throw new ProviderRegistryError("compatibility_evidence_invalid", "Compatibility evidence dates are invalid.");
  return { schemaVersion: 1, id: String(value.id), provider: String(value.provider), support: value.support ?? "stable", verifiedAt: new Date(value.verifiedAt).toISOString(), expiresAt: new Date(value.expiresAt).toISOString(), models: [...new Set((value.models ?? []).map(String))], fixtureHashes: [...new Set((value.fixtureHashes ?? []).map(String))], limitations: (value.limitations ?? []).map(String) };
}

export function createCompatibilityEvidence(provider, { id = `${provider}-${Date.now()}`, verifiedAt = new Date(), models = [], fixtureHashes = [], limitations = [], support = "stable" } = {}) {
  const definition = providerDefinition(provider);
  const days = definition.kind === "local-model" ? LOCAL_EVIDENCE_DAYS : HOSTED_EVIDENCE_DAYS;
  const start = new Date(verifiedAt);
  return validateCompatibilityEvidence({ schemaVersion: 1, id, provider, support, verifiedAt: start.toISOString(), expiresAt: new Date(start.getTime() + days * 86_400_000).toISOString(), models, fixtureHashes, limitations });
}

export function evidenceFreshness(evidence, now = new Date()) { return Date.parse(evidence.expiresAt) > now.getTime() ? "current" : "stale"; }
