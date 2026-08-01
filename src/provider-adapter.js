import { discoverOllamaModels, invokeProvider, providerAuthPlan, providerDefinition, providerRuntimeStatus, PROVIDER_DEFINITIONS, streamProvider } from "./provider-runtime.js";
import { randomUUID } from "node:crypto";

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
    this.operations = new Map();
    this.implementation = {
      status: implementation.status ?? providerRuntimeStatus,
      invoke: implementation.invoke ?? invokeProvider,
      models: implementation.models ?? discoverOllamaModels,
      authPlan: implementation.authPlan ?? providerAuthPlan,
      stream: implementation.stream ?? streamProvider,
    };
  }

  metadata() {
    const stable = ["openai", "claude", "gemini", "openrouter", "ollama"].includes(this.name);
    return Object.freeze({ schemaVersion: PROVIDER_ADAPTER_VERSION, id: this.name, name: this.name, service: this.definition.service ?? this.name, kind: this.definition.kind, support: stable ? "stable" : "compatibility-only", defaultModel: this.definition.defaultModel ?? null, credentialReference: this.definition.credential ?? null, storesSecrets: false, capabilities: [...this.definition.capabilities], limitation: this.definition.limitation ?? null });
  }

  capabilities() { return [...this.definition.capabilities]; }
  supports(capability) { return this.definition.capabilities.includes(capability); }
  require(capability) { if (!this.supports(capability)) throw new ProviderCapabilityError(this.name, capability); }
  validateConfiguration(configuration = {}) {
    const errors = [];
    if (configuration.provider && configuration.provider !== this.name) errors.push(`Configuration provider must be ${this.name}.`);
    if (configuration.timeoutMs !== undefined && (!Number.isInteger(Number(configuration.timeoutMs)) || Number(configuration.timeoutMs) <= 0)) errors.push("timeoutMs must be a positive integer.");
    if (configuration.tools?.length && !this.supports("tools")) errors.push(`${this.name} does not support tools.`);
    if (configuration.structuredOutput && !this.supports("structured-output")) errors.push(`${this.name} does not support structured output.`);
    return { valid: errors.length === 0, errors, metadata: this.metadata() };
  }
  async health(options) { this.require("health"); return this.implementation.status(this.root, this.name, options); }
  async invoke(request, options = {}) {
    if (!(this.supports("invoke") || this.supports("generate") || this.supports("agent-execute"))) throw new ProviderCapabilityError(this.name, "invoke");
    this.#validateRequestCapabilities(request);
    const operationId = request?.operationId ?? randomUUID();
    const { controller, detach } = linkedController(options.signal);
    this.operations.set(operationId, controller);
    try { return await this.implementation.invoke(this.root, this.name, { ...request, operationId }, { ...options, signal: controller.signal }); }
    finally { detach(); this.operations.delete(operationId); }
  }
  async *stream(request, options = {}) {
    this.require("stream");
    this.#validateRequestCapabilities(request);
    const operationId = request?.operationId ?? randomUUID();
    const { controller, detach } = linkedController(options.signal);
    this.operations.set(operationId, controller);
    let sequence = 0;
    try {
      yield { type: "start", operationId, sequence: sequence++, provider: this.name };
      for await (const event of this.implementation.stream(this.root, this.name, { ...request, operationId }, { ...options, signal: controller.signal })) {
        yield { ...event, operationId, sequence: sequence++ };
      }
    } catch (error) {
      yield { type: "error", operationId, sequence: sequence++, error: { code: error.code ?? "provider_unavailable", message: error.message, retryable: Boolean(error.retryable) } };
    } finally { detach(); this.operations.delete(operationId); }
  }
  async discoverModels(options) { this.require("model-discovery"); return this.implementation.models(options); }
  async models(options) { return this.discoverModels(options); }
  cancel(operationId) { const controller = this.operations.get(operationId); if (!controller) return { operationId, cancelled: false, reason: "operation-not-running" }; controller.abort(); return { operationId, cancelled: true }; }
  auth(action = "login") { this.require("auth-status"); return this.implementation.authPlan(this.name, action); }
  #validateRequestCapabilities(request = {}) { if (request.tools?.length) this.require("tools"); if (request.structuredOutput) this.require("structured-output"); }
}

export function createProviderAdapter(root, name, implementation) { return new ProviderAdapter(root, name, implementation); }
export function providerCompatibilityMatrix(root = process.cwd()) { return Object.keys(PROVIDER_DEFINITIONS).map((name) => createProviderAdapter(root, name).metadata()); }
function linkedController(signal) { const controller = new AbortController(); const abort = () => controller.abort(); if (signal?.aborted) controller.abort(); else signal?.addEventListener("abort", abort, { once: true }); return { controller, detach: () => signal?.removeEventListener("abort", abort) }; }
