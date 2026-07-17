import { discoverOllamaModels, invokeProvider, providerAuthPlan, providerDefinition, providerRuntimeStatus, PROVIDER_DEFINITIONS } from "./provider-runtime.js";

export const PROVIDER_ADAPTER_VERSION = 1;

export class ProviderCapabilityError extends Error {
  constructor(provider, capability) {
    super(`${provider} does not declare provider capability ${capability}.`);
    this.name = "ProviderCapabilityError";
    this.code = "provider_capability_unavailable";
    this.provider = provider;
    this.capability = capability;
  }
}

export class ProviderAdapter {
  constructor(root, name, implementation = {}) {
    this.root = root;
    this.name = name;
    this.definition = providerDefinition(name);
    this.implementation = {
      status: implementation.status ?? providerRuntimeStatus,
      invoke: implementation.invoke ?? invokeProvider,
      models: implementation.models ?? discoverOllamaModels,
      authPlan: implementation.authPlan ?? providerAuthPlan,
    };
  }

  metadata() {
    return Object.freeze({ schemaVersion: PROVIDER_ADAPTER_VERSION, name: this.name, kind: this.definition.kind, defaultModel: this.definition.defaultModel ?? null, credentialReference: this.definition.credential ?? null, capabilities: [...this.definition.capabilities], limitation: this.definition.limitation ?? null });
  }

  supports(capability) { return this.definition.capabilities.includes(capability); }
  require(capability) { if (!this.supports(capability)) throw new ProviderCapabilityError(this.name, capability); }
  async health(options) { this.require("health"); return this.implementation.status(this.root, this.name, options); }
  async invoke(request, options) { if (!(this.supports("generate") || this.supports("agent-execute"))) throw new ProviderCapabilityError(this.name, "generate"); return this.implementation.invoke(this.root, this.name, request, options); }
  async models(options) { this.require("model-discovery"); return this.implementation.models(options); }
  auth(action = "login") { this.require("auth-status"); return this.implementation.authPlan(this.name, action); }
}

export function createProviderAdapter(root, name, implementation) { return new ProviderAdapter(root, name, implementation); }
export function providerCompatibilityMatrix(root = process.cwd()) { return Object.keys(PROVIDER_DEFINITIONS).map((name) => createProviderAdapter(root, name).metadata()); }
