import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readProviderPolicy, recordProviderUsage } from "./provider-policy.js";
import { readCredential } from "./credentials.js";
import { randomUUID } from "node:crypto";

const executeFile = promisify(execFile);

export const PROVIDER_DEFINITIONS = Object.freeze({
  openai: {
    kind: "model-api",
    credential: "OPENAI_API_KEY",
    defaultModel: "gpt-5.4-mini",
    capabilities: ["generate", "health", "mcp-host"],
  },
  claude: {
    kind: "model-api",
    credential: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-5",
    capabilities: ["generate", "health", "mcp-host"],
  },
  gemini: {
    kind: "model-api",
    credential: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    capabilities: ["generate", "health", "mcp-host"],
  },
  openrouter: {
    kind: "model-api",
    credential: "OPENROUTER_API_KEY",
    defaultModel: "openrouter/auto",
    capabilities: ["generate", "health"],
  },
  ollama: {
    kind: "local-model",
    credential: null,
    defaultModel: "llama3.2",
    capabilities: ["generate", "health", "model-discovery"],
  },
  codex: {
    kind: "agent-host",
    credential: "OPENAI_API_KEY",
    executable: "codex",
    capabilities: ["agent-execute", "auth-status", "mcp-host"],
  },
  cursor: {
    kind: "agent-host",
    credential: "CURSOR_API_KEY",
    executable: "cursor-agent",
    capabilities: ["agent-execute", "auth-status", "mcp-host"],
  },
  windsurf: {
    kind: "agent-host",
    credential: null,
    executable: "windsurf",
    capabilities: ["auth-status", "mcp-host"],
    limitation: "No stable headless invocation contract is enabled. Use the authenticated Windsurf host.",
  },
});

export class ProviderRequestError extends Error {
  constructor(message, { provider, status = null, retryable = false, code = "provider_request_failed", retryAfterMs = null } = {}) {
    super(message);
    this.name = "ProviderRequestError";
    this.provider = provider;
    this.status = status;
    this.retryable = retryable;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export function providerDefinition(name) {
  const definition = PROVIDER_DEFINITIONS[name];
  if (!definition) throw new Error(`Choose one of: ${Object.keys(PROVIDER_DEFINITIONS).join(", ")}.`);
  return definition;
}

export async function providerRuntimeStatus(root, name, { execImpl = executeFile, fetchImpl = globalThis.fetch } = {}) {
  const definition = providerDefinition(name);
  const credentialAvailable = definition.credential ? Boolean(await readCredential(root, definition.credential)) : null;
  if (definition.kind === "model-api") {
    return { provider: name, kind: definition.kind, capabilities: definition.capabilities, credentialAvailable, executableAvailable: null, limitation: null };
  }
  if (definition.kind === "local-model") {
    try { const models = await discoverOllamaModels({ fetchImpl }); return { provider: name, kind: definition.kind, capabilities: definition.capabilities, credentialAvailable: null, executableAvailable: true, healthy: true, models: models.map(({ name }) => name), limitation: null }; }
    catch (error) { return { provider: name, kind: definition.kind, capabilities: definition.capabilities, credentialAvailable: null, executableAvailable: false, healthy: false, models: [], limitation: error.message }; }
  }
  return {
    provider: name,
    kind: definition.kind,
    capabilities: definition.capabilities,
    credentialAvailable,
    executableAvailable: await executableAvailable(definition.executable, execImpl),
    limitation: definition.limitation ?? null,
  };
}

export async function invokeProvider(root, name, request, { fetchImpl = globalThis.fetch, execImpl = executeFile, sleepImpl = delay, randomImpl = Math.random } = {}) {
  const definition = providerDefinition(name);
  const policy = await readProviderPolicy(root, name);
  const normalized = validateRequest(name, request, policy);
  if (definition.kind === "agent-host") return invokeAgentHost(name, definition, normalized, execImpl);
  const key = definition.credential ? await readCredential(root, definition.credential) : null;
  if (definition.credential && !key) throw new ProviderRequestError(`Missing ${definition.credential}. Configure the provider before invoking it.`, { provider: name, code: "credential_missing" });
  let lastError;
  for (let attempt = 0; attempt <= normalized.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), normalized.timeoutMs);
    try {
      const response = await fetchImpl(buildUrl(name, normalized.model), { method: "POST", headers: buildHeaders(name, key, normalized.idempotencyKey), body: JSON.stringify(buildBody(name, normalized)), signal: controller.signal });
      const payload = await readPayload(response);
      if (!response.ok) throw providerHttpError(name, response.status, payload, response.headers);
      const result = normalizeResponse(name, payload, normalized.model);
      await recordProviderUsage(root, name, { inputCharacters: normalized.prompt.length, outputCharacters: result.text.length, usage: result.usage });
      return { ...result, attempts: attempt + 1 };
    } catch (error) {
      lastError = error?.name === "AbortError" ? new ProviderRequestError(`Provider request timed out after ${normalized.timeoutMs}ms.`, { provider: name, retryable: true, code: "timeout" }) : error instanceof ProviderRequestError ? error : new ProviderRequestError(error?.message ?? "Provider request failed.", { provider: name, retryable: true });
      if (!lastError.retryable || attempt === normalized.retries) throw lastError;
      const exponential = Math.min(250 * (2 ** attempt), 2000);
      const jittered = Math.round(exponential * (0.5 + randomImpl() * 0.5));
      await sleepImpl(lastError.retryAfterMs ?? jittered);
    } finally { clearTimeout(timeout); }
  }
  throw lastError;
}

export async function discoverOllamaModels({ fetchImpl = globalThis.fetch } = {}) {
  const response = await fetchImpl(`${ollamaBaseUrl()}/api/tags`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new ProviderRequestError(`Ollama health check failed with HTTP ${response.status}.`, { provider: "ollama", status: response.status, code: "local_model_unavailable" });
  const payload = await response.json();
  return Array.isArray(payload.models) ? payload.models.map((model) => ({ name: model.name, size: model.size ?? null, modifiedAt: model.modified_at ?? null })) : [];
}

export function providerAuthPlan(name, action = "login") {
  const definition = providerDefinition(name);
  if (definition.kind !== "agent-host") throw new Error(`${name} uses API-key authentication; configure its credential reference instead.`);
  if (name === "windsurf") return { provider: name, action, supported: false, manualRequired: true, command: "Open Windsurf and authenticate through its account settings.", scope: "Windsurf host", dataImpact: "Authentication is managed by Windsurf.", affectedPaths: ["Windsurf user profile"], rollback: "Sign out through Windsurf." };
  return { provider: name, action, supported: true, command: `${definition.executable} ${action}`, executable: definition.executable, args: [action], scope: `${name} user authentication`, dataImpact: "Opens or updates the provider host's user authentication session.", affectedPaths: [`${name} user profile outside this project`], rollback: `Run ${definition.executable} logout.` };
}

export async function executeProviderAuth(plan, { execImpl = executeFile } = {}) {
  if (!plan.supported) return plan;
  const { stdout, stderr } = await execImpl(plan.executable, plan.args, { windowsHide: false, timeout: 300000 });
  return { provider: plan.provider, action: plan.action, executed: true, stdout: stdout.trim(), stderr: stderr.trim() };
}

function validateRequest(name, request, policy) {
  const definition = providerDefinition(name);
  if (!definition.capabilities.includes("generate") && !definition.capabilities.includes("agent-execute")) {
    throw new ProviderRequestError(definition.limitation ?? `${name} does not support invocation.`, { provider: name, code: "capability_unavailable" });
  }
  const prompt = request?.prompt?.trim();
  if (!prompt) throw new ProviderRequestError("A non-empty prompt is required.", { provider: name, code: "invalid_request" });
  if (policy.mode !== "unrestricted" && prompt.length > policy.maxInputCharacters) {
    throw new ProviderRequestError(`Prompt exceeds the ${policy.maxInputCharacters} character policy limit.`, { provider: name, code: "policy_limit" });
  }
  if (policy.mode === "budgeted" && policy.usage.requests >= policy.monthlyRequestLimit) {
    throw new ProviderRequestError("The configured local request budget has been reached.", { provider: name, code: "budget_exceeded" });
  }
  return {
    prompt,
    model: request.model ?? definition.defaultModel,
    maxOutputTokens: Math.min(Number(request.maxOutputTokens ?? policy.maxOutputTokens), policy.mode === "unrestricted" ? 131072 : policy.maxOutputTokens),
    timeoutMs: Math.min(Number(request.timeoutMs ?? policy.timeoutMs), policy.mode === "unrestricted" ? 600000 : policy.timeoutMs),
    retries: Math.min(Number(request.retries ?? policy.retries), 5),
    idempotencyKey: request.idempotencyKey ?? randomUUID(),
  };
}

async function invokeAgentHost(name, definition, request, execImpl) {
  if (!(await executableAvailable(definition.executable, execImpl))) {
    throw new ProviderRequestError(`${definition.executable} is not available on PATH.`, { provider: name, code: "host_unavailable" });
  }
  const args = name === "codex"
    ? ["exec", "--skip-git-repo-check", request.prompt]
    : ["--print", "--output-format", "text", request.prompt];
  const { stdout, stderr } = await execImpl(definition.executable, args, { windowsHide: true, timeout: request.timeoutMs, maxBuffer: 10 * 1024 * 1024 });
  return { provider: name, kind: "agent-host", model: request.model ?? null, text: stdout.trim(), usage: null, stderr: stderr.trim() };
}

function buildUrl(name, model) {
  if (name === "ollama") return `${ollamaBaseUrl()}/api/generate`;
  if (name === "openai") return "https://api.openai.com/v1/responses";
  if (name === "claude") return "https://api.anthropic.com/v1/messages";
  if (name === "gemini") return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  return "https://openrouter.ai/api/v1/chat/completions";
}

function buildHeaders(name, key, idempotencyKey) {
  const common = { "content-type": "application/json" };
  if (name === "ollama") return common;
  if (name === "claude") return { ...common, "x-api-key": key, "anthropic-version": "2023-06-01" };
  if (name === "gemini") return { ...common, "x-goog-api-key": key };
  return { ...common, authorization: `Bearer ${key}`, ...(name === "openai" ? { "idempotency-key": idempotencyKey } : {}) };
}

function buildBody(name, request) {
  if (name === "ollama") return { model: request.model, prompt: request.prompt, stream: false, options: { num_predict: request.maxOutputTokens } };
  if (name === "openai") return { model: request.model, input: request.prompt, max_output_tokens: request.maxOutputTokens };
  if (name === "claude") return { model: request.model, max_tokens: request.maxOutputTokens, messages: [{ role: "user", content: request.prompt }] };
  if (name === "gemini") return { contents: [{ role: "user", parts: [{ text: request.prompt }] }], generationConfig: { maxOutputTokens: request.maxOutputTokens } };
  return { model: request.model, max_tokens: request.maxOutputTokens, messages: [{ role: "user", content: request.prompt }] };
}

function normalizeResponse(name, payload, model) {
  if (name === "ollama") return { provider: name, kind: "local-model", model: payload.model ?? model, text: payload.response ?? "", usage: { inputTokens: payload.prompt_eval_count ?? null, outputTokens: payload.eval_count ?? null }, requestId: null };
  if (name === "openai") {
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text).join("") ?? "";
    return { provider: name, kind: "model-api", model: payload.model ?? model, text, usage: payload.usage ?? null, requestId: payload.id ?? null };
  }
  if (name === "claude") return { provider: name, kind: "model-api", model: payload.model ?? model, text: payload.content?.filter((item) => item.type === "text").map((item) => item.text).join("") ?? "", usage: payload.usage ?? null, requestId: payload.id ?? null };
  if (name === "gemini") return { provider: name, kind: "model-api", model, text: payload.candidates?.[0]?.content?.parts?.map((item) => item.text ?? "").join("") ?? "", usage: payload.usageMetadata ?? null, requestId: payload.responseId ?? null };
  return { provider: name, kind: "model-api", model: payload.model ?? model, text: payload.choices?.[0]?.message?.content ?? "", usage: payload.usage ?? null, requestId: payload.id ?? null };
}
function ollamaBaseUrl() { return (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, ""); }
function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

async function executableAvailable(executable, execImpl) {
  try {
    await execImpl(executable, ["--version"], { windowsHide: true, timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 1000) }; }
}

function providerHttpError(provider, status, payload, headers) {
  const message = payload?.error?.message ?? payload?.message ?? `Provider returned HTTP ${status}.`;
  return new ProviderRequestError(message, { provider, status, retryable: status === 408 || status === 429 || status >= 500, code: "provider_http_error", retryAfterMs: parseRetryAfter(headers?.get?.("retry-after")) });
}
function parseRetryAfter(value) { if (!value) return null; if (/^\d+(?:\.\d+)?$/.test(value)) return Math.max(0, Math.round(Number(value) * 1000)); const date = Date.parse(value); return Number.isNaN(date) ? null : Math.max(0, date - Date.now()); }
