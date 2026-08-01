import { createProviderAdapter, providerCompatibilityMatrix } from "./provider-adapter.js";
import { InvocationCoordinator } from "./invocation-coordinator.js";
import { ProviderRegistry, profileFromDefinition } from "./provider-registry.js";
import { configureProviderCredential, initializeProviderProfile, listProviderProfiles, providerStatus, removeProviderProfile } from "./providers.js";
import { readStateDocument } from "./state-documents.js";
import { readFile } from "node:fs/promises";
import path from "node:path";

export class ProviderService {
  constructor(root, { registry = new ProviderRegistry(root), coordinator } = {}) {
    this.root = root;
    this.registry = registry;
    this.coordinator = coordinator ?? new InvocationCoordinator(root, { registry });
  }

  list() { return listProviderProfiles(); }
  adapter(provider, implementation) { return createProviderAdapter(this.root, provider, implementation); }
  compatibilityMatrix() { return providerCompatibilityMatrix(this.root); }
  initialize(provider, options) { return initializeProviderProfile(this.root, provider, options); }
  configureCredential(provider, secret, options) { return configureProviderCredential(this.root, provider, secret, options); }
  status(provider) { return providerStatus(this.root, provider); }
  remove(provider, options) { return removeProviderProfile(this.root, provider, options); }
  invoke(provider, request, options) { return this.coordinator.invoke(provider, request, options); }
  stream(provider, request, options) { return this.coordinator.stream(provider, request, options); }
  cancel(operationId) { return this.coordinator.cancel(operationId); }
  registerProfile(provider, overrides = {}, options) { return this.registry.registerProfile(profileFromDefinition(provider, overrides), options); }
  migrate(options) { return this.registry.migrate(options); }
  async migrateLegacy(options = {}) {
    const legacyWorkspace = await readStateDocument(this.root, ".ai-workspace/workspace.json", null);
    const legacyProfiles = {};
    for (const provider of legacyWorkspace?.providerProfiles ?? []) {
      try { legacyProfiles[provider] = JSON.parse(await readFile(path.join(this.root, ".ai-workspace", "providers", `${provider}.json`), "utf8")); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    return this.registry.migrate({ legacyWorkspace, legacyProfiles, ...options });
  }
}

export function createProviderService(root, options) { return new ProviderService(root, options); }
