import { randomUUID } from "node:crypto";
import { createProviderAdapter } from "./provider-adapter.js";
import { readProviderPolicy, recordProviderUsage } from "./provider-policy.js";
import { ProviderRequestError } from "./provider-runtime.js";

export class InvocationCoordinator {
  constructor(root, { adapterFactory = createProviderAdapter, clock = () => Date.now(), sleep = delay, random = Math.random, registry = null } = {}) {
    this.root = root;
    this.adapterFactory = adapterFactory;
    this.clock = clock;
    this.sleep = sleep;
    this.random = random;
    this.registry = registry;
    this.operations = new Map();
  }

  async invoke(provider, request = {}, options = {}) {
    const operationId = request.operationId ?? randomUUID();
    const policy = await readProviderPolicy(this.root, provider);
    const timeoutMs = positiveInteger(request.timeoutMs ?? policy.timeoutMs, "timeoutMs");
    const deadline = this.clock() + timeoutMs;
    const idempotency = request.idempotency ?? (request.tools?.length ? "non-idempotent" : "read-only");
    const retries = Math.min(2, nonNegativeInteger(request.retries ?? policy.retries, "retries"));
    const maxAttempts = Math.min(3, positiveInteger(request.budget?.maxAttempts ?? policy.maxAttempts ?? 3, "budget.maxAttempts"));
    const fallbackProviders = [...new Set((options.fallbackProviders ?? request.fallbackProviders ?? []).filter((name) => name && name !== provider))];
    const candidates = [provider, ...fallbackProviders];
    const controller = new AbortController();
    this.operations.set(operationId, controller);
    let attempt = 0;
    let lastError;
    try {
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        const candidate = candidates[candidateIndex];
        if (candidateIndex > 0) this.#assertFallbackAllowed(request, idempotency);
        const compatibility = this.registry ? await this.registry.compatibility(candidate, { requireCurrent: options.requireCurrentCompatibility ?? request.requireCurrentCompatibility ?? policy.requireCurrentCompatibility }) : null;
        const adapter = this.adapterFactory(this.root, candidate, options.implementations?.[candidate]);
        this.#assertEquivalentCapabilities(adapter, request);
        let candidateAttempt = 0;
        while (attempt < maxAttempts && candidateAttempt <= retries) {
          const remainingMs = deadline - this.clock();
          if (remainingMs <= 0) throw new ProviderRequestError("Provider invocation deadline was exhausted.", { provider: candidate, code: "timeout", retryable: false });
          attempt += 1;
          candidateAttempt += 1;
          try {
            const response = await adapter.invoke({ ...request, provider: candidate, operationId, idempotency, timeoutMs: remainingMs, retries: 0 }, { ...options, signal: controller.signal, recordUsage: false });
            assertResponseBudget(response, request.budget ?? policy);
            await recordProviderUsage(this.root, candidate, { inputCharacters: requestCharacters(request), outputCharacters: String(response.text ?? "").length, usage: response.usage });
            return { ...response, provider: candidate, operationId, attempts: attempt, fallbackUsed: candidateIndex > 0, policyResult: { approved: true, mode: policy.mode, idempotency, fallbackAllowed: request.allowFallback === true, maxAttempts, deadlineMs: timeoutMs }, compatibilityEvidence: compatibility?.evidence ?? null, compatibilityFreshness: compatibility?.freshness ?? "not-evaluated", warnings: [...(response.warnings ?? []), ...(compatibility && compatibility.freshness !== "current" ? [`Compatibility evidence is ${compatibility.freshness}.`] : []), ...(candidateIndex > 0 ? [`Fallback used: ${candidate}.`] : [])] };
          } catch (error) {
            lastError = normalizeError(error, candidate);
            if (controller.signal.aborted) throw new ProviderRequestError("Provider invocation was cancelled.", { provider: candidate, code: "cancellation", retryable: false });
            const canRetry = lastError.retryable && safeIdempotency(idempotency) && attempt < maxAttempts && candidateAttempt <= retries && deadline > this.clock();
            if (!canRetry) break;
            const backoff = lastError.retryAfterMs ?? Math.round(Math.min(250 * (2 ** (attempt - 1)), 2000) * this.random());
            if (this.clock() + backoff >= deadline) break;
            await this.sleep(backoff, controller.signal);
          }
        }
      }
      if (lastError?.retryable && !safeIdempotency(idempotency)) throw new ProviderRequestError("Retry or fallback was denied for a non-idempotent request.", { provider, code: "unsafe_retry", retryable: false });
      throw lastError ?? new ProviderRequestError("Provider invocation failed.", { provider, code: "provider_unavailable", retryable: false });
    } finally { this.operations.delete(operationId); }
  }

  async *stream(provider, request = {}, options = {}) {
    const operationId = request.operationId ?? randomUUID();
    const policy = await readProviderPolicy(this.root, provider);
    if (this.registry && (options.requireCurrentCompatibility ?? request.requireCurrentCompatibility ?? policy.requireCurrentCompatibility)) await this.registry.compatibility(provider, { requireCurrent: true });
    const controller = new AbortController();
    this.operations.set(operationId, controller);
    try {
      const adapter = this.adapterFactory(this.root, provider, options.implementations?.[provider]);
      this.#assertEquivalentCapabilities(adapter, request);
      for await (const event of adapter.stream({ ...request, operationId, timeoutMs: request.timeoutMs ?? policy.timeoutMs }, { ...options, signal: controller.signal })) yield event;
    } finally { this.operations.delete(operationId); }
  }

  cancel(operationId) {
    const controller = this.operations.get(operationId);
    if (!controller) return { operationId, cancelled: false, reason: "operation-not-running" };
    controller.abort();
    return { operationId, cancelled: true };
  }

  #assertFallbackAllowed(request, idempotency) {
    if (!safeIdempotency(idempotency) || request.externalEffectCommitted || request.toolEffectCommitted) throw new ProviderRequestError("Fallback is unsafe after a non-idempotent or committed external effect.", { code: "unsafe_retry", retryable: false });
    if (request.allowFallback !== true) throw new ProviderRequestError("Fallback requires explicit request approval.", { code: "policy_denial", retryable: false });
  }

  #assertEquivalentCapabilities(adapter, request) {
    for (const capability of request.requiredCapabilities ?? []) if (!adapter.supports(capability)) throw new ProviderRequestError(`Fallback provider ${adapter.name} lacks required capability ${capability}.`, { provider: adapter.name, code: "capability_unavailable", retryable: false });
  }
}

function safeIdempotency(value) { return value === "read-only" || value === "idempotent"; }
function requestCharacters(request) { return request.prompt ? String(request.prompt).length : (request.messages ?? []).reduce((total, entry) => total + String(entry.content ?? "").length, 0); }
function normalizeError(error, provider) { return error instanceof ProviderRequestError ? error : new ProviderRequestError("Provider transport failed.", { provider, code: "transport", retryable: true }); }
function assertResponseBudget(response, budget = {}) {
  const totalTokens = Number(response.usage?.total_tokens ?? response.usage?.totalTokens ?? 0);
  if (budget.maxTotalTokens !== undefined && totalTokens > Number(budget.maxTotalTokens)) throw new ProviderRequestError("Provider response exceeded the approved token budget.", { code: "budget_exhausted", retryable: false });
  const estimatedCost = Number(response.usage?.estimatedCost ?? 0);
  if (budget.maxEstimatedCost !== undefined && estimatedCost > Number(budget.maxEstimatedCost)) throw new ProviderRequestError("Provider response exceeded the approved cost budget.", { code: "budget_exhausted", retryable: false });
}
function positiveInteger(value, field) { const number = Number(value); if (!Number.isInteger(number) || number <= 0) throw new ProviderRequestError(`${field} must be a positive integer.`, { code: "invalid_request", retryable: false }); return number; }
function nonNegativeInteger(value, field) { const number = Number(value); if (!Number.isInteger(number) || number < 0) throw new ProviderRequestError(`${field} must be a non-negative integer.`, { code: "invalid_request", retryable: false }); return number; }
function delay(milliseconds, signal) { return new Promise((resolve, reject) => { const timer = setTimeout(resolve, milliseconds); signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new ProviderRequestError("Provider invocation was cancelled.", { code: "cancellation", retryable: false })); }, { once: true }); }); }
