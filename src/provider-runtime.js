import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readProviderPolicy, recordProviderUsage } from "./provider-policy.js";
import { readCredential } from "./credentials.js";
import { randomUUID } from "node:crypto";

const executeFile = promisify(execFile);

export const PROVIDER_DEFINITIONS = Object.freeze({
  openai: {
    service: "OpenAI",
    kind: "model-api",
    credential: "OPENAI_API_KEY",
    defaultModel: "gpt-5.4-mini",
    capabilities: ["generate", "invoke", "stream", "structured-output", "tools", "cancel", "health", "mcp-host"],
  },
  claude: {
    service: "Anthropic",
    kind: "model-api",
    credential: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-5",
    capabilities: ["generate", "invoke", "stream", "structured-output", "tools", "cancel", "health", "mcp-host"],
  },
  gemini: {
    service: "Google Gemini",
    kind: "model-api",
    credential: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    capabilities: ["generate", "invoke", "stream", "structured-output", "tools", "cancel", "health", "mcp-host"],
  },
  openrouter: {
    service: "OpenRouter",
    kind: "model-api",
    credential: "OPENROUTER_API_KEY",
    defaultModel: "openrouter/auto",
    capabilities: ["generate", "invoke", "stream", "structured-output", "tools", "cancel", "health"],
  },
  ollama: {
    service: "Ollama",
    kind: "local-model",
    credential: null,
    defaultModel: "llama3.2",
    capabilities: ["generate", "invoke", "stream", "structured-output", "tools", "cancel", "health", "model-discovery"],
  },
  codex: {
    service: "OpenAI Codex",
    kind: "agent-host",
    credential: "OPENAI_API_KEY",
    executable: "codex",
    capabilities: ["agent-execute", "auth-status", "mcp-host"],
  },
  cursor: {
    service: "Cursor",
    kind: "agent-host",
    credential: "CURSOR_API_KEY",
    executable: "cursor-agent",
    capabilities: ["agent-execute", "auth-status", "mcp-host"],
  },
  windsurf: {
    service: "Windsurf",
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

export async function invokeProvider(root, name, request, { fetchImpl = globalThis.fetch, execImpl = executeFile, sleepImpl = delay, randomImpl = Math.random, signal, recordUsage = true } = {}) {
  const definition = providerDefinition(name);
  const policy = await readProviderPolicy(root, name);
  const normalized = validateRequest(name, request, policy);
  if (definition.kind === "agent-host") return invokeAgentHost(name, definition, normalized, execImpl);
  const key = definition.credential ? await readCredential(root, definition.credential) : null;
  if (definition.credential && !key) throw new ProviderRequestError(`Missing ${definition.credential}. Configure the provider before invoking it.`, { provider: name, code: "credential_missing" });
  let lastError;
  for (let attempt = 0; attempt <= normalized.retries; attempt += 1) {
    const controller = new AbortController();
    const combinedSignal = combineSignals(signal, controller.signal);
    const timeout = setTimeout(() => controller.abort(), normalized.timeoutMs);
    try {
      const response = await fetchImpl(buildUrl(name, normalized.model), { method: "POST", headers: buildHeaders(name, key, normalized.idempotencyKey), body: JSON.stringify(buildBody(name, normalized)), signal: combinedSignal });
      const payload = await readPayload(response);
      if (!response.ok) throw providerHttpError(name, response.status, payload, response.headers);
      const result = normalizeResponse(name, payload, normalized.model);
      if (recordUsage) await recordProviderUsage(root, name, { inputCharacters: normalized.prompt.length, outputCharacters: result.text.length, usage: result.usage });
      return { ...result, operationId: normalized.operationId, finishReason: result.finishReason ?? null, warnings: [], attempts: attempt + 1 };
    } catch (error) {
      lastError = error?.name === "AbortError" ? new ProviderRequestError(signal?.aborted ? "Provider request was cancelled." : `Provider request timed out after ${normalized.timeoutMs}ms.`, { provider: name, retryable: !signal?.aborted, code: signal?.aborted ? "cancellation" : "timeout" }) : error instanceof ProviderRequestError ? error : new ProviderRequestError("Provider transport failed.", { provider: name, retryable: true, code: "transport" });
      if (!lastError.retryable || attempt === normalized.retries || !safeToRetry(normalized)) throw lastError;
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

export async function* streamProvider(root, name, request, { fetchImpl = globalThis.fetch, signal } = {}) {
  const definition = providerDefinition(name);
  if (definition.kind === "agent-host") throw new ProviderRequestError(`${name} does not expose the ProviderAdapter streaming contract.`, { provider: name, code: "capability_unavailable" });
  const policy = await readProviderPolicy(root, name);
  const normalized = validateRequest(name, { ...request, retries: 0 }, policy);
  const key = definition.credential ? await readCredential(root, definition.credential) : null;
  if (definition.credential && !key) throw new ProviderRequestError(`Missing ${definition.credential}. Configure the provider before invoking it.`, { provider: name, code: "credential_missing" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), normalized.timeoutMs);
  try {
    const response = await fetchImpl(buildStreamUrl(name, normalized.model), { method: "POST", headers: buildHeaders(name, key, normalized.idempotencyKey), body: JSON.stringify({ ...buildBody(name, normalized), stream: true }), signal: combineSignals(signal, controller.signal) });
    if (!response.ok) throw providerHttpError(name, response.status, await readPayload(response), response.headers);
    if (!response.body) throw new ProviderRequestError("Provider stream did not include a response body.", { provider: name, code: "malformed_response" });
    let buffer = "";
    for await (const chunk of response.body) {
      buffer += new TextDecoder().decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const payload = parseStreamLine(line);
        if (!payload) continue;
        for (const event of normalizeStreamPayload(name, payload)) yield event;
      }
    }
    if (buffer.trim()) {
      const payload = parseStreamLine(buffer);
      if (payload) for (const event of normalizeStreamPayload(name, payload)) yield event;
    }
  } catch (error) {
    if (error?.name === "AbortError") throw new ProviderRequestError(signal?.aborted ? "Provider stream was cancelled." : "Provider stream timed out.", { provider: name, code: signal?.aborted ? "cancellation" : "timeout", retryable: false });
    throw error;
  } finally { clearTimeout(timeout); }
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
  const messages = normalizeMessages(request);
  const prompt = messages.map((entry) => entry.content).join("\n").trim();
  if (!prompt) throw new ProviderRequestError("A non-empty prompt is required.", { provider: name, code: "invalid_request" });
  if (policy.mode !== "unrestricted" && prompt.length > policy.maxInputCharacters) {
    throw new ProviderRequestError(`Prompt exceeds the ${policy.maxInputCharacters} character policy limit.`, { provider: name, code: "policy_limit" });
  }
  if (policy.mode === "budgeted" && policy.usage.requests >= policy.monthlyRequestLimit) {
    throw new ProviderRequestError("The configured local request budget has been reached.", { provider: name, code: "budget_exceeded" });
  }
  return {
    prompt,
    messages,
    operationId: request.operationId ?? randomUUID(),
    model: request.model ?? definition.defaultModel,
    maxOutputTokens: Math.min(Number(request.maxOutputTokens ?? policy.maxOutputTokens), policy.mode === "unrestricted" ? 131072 : policy.maxOutputTokens),
    timeoutMs: Math.min(Number(request.timeoutMs ?? policy.timeoutMs), policy.mode === "unrestricted" ? 600000 : policy.timeoutMs),
    retries: Math.min(Number(request.retries ?? policy.retries), 2),
    idempotencyKey: request.idempotencyKey ?? randomUUID(),
    idempotency: request.idempotency ?? (request.tools?.length ? "non-idempotent" : "read-only"),
    dataClassification: request.dataClassification ?? "restricted",
    tools: request.tools ?? [],
    structuredOutput: request.structuredOutput ?? null,
    budget: request.budget ?? {},
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
function buildStreamUrl(name, model) { return name === "gemini" ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse` : buildUrl(name, model); }

function buildHeaders(name, key, idempotencyKey) {
  const common = { "content-type": "application/json" };
  if (name === "ollama") return common;
  if (name === "claude") return { ...common, "x-api-key": key, "anthropic-version": "2023-06-01" };
  if (name === "gemini") return { ...common, "x-goog-api-key": key };
  return { ...common, authorization: `Bearer ${key}`, ...(name === "openai" ? { "idempotency-key": idempotencyKey } : {}) };
}

function buildBody(name, request) {
  if (name === "ollama") return { model: request.model, prompt: request.prompt, stream: false, options: { num_predict: request.maxOutputTokens }, ...(request.tools.length ? { tools: request.tools } : {}), ...(request.structuredOutput ? { format: request.structuredOutput } : {}) };
  if (name === "openai") {
    const input = request.messages.length === 1 && request.messages[0].role === "user" ? request.messages[0].content : request.messages;
    return { model: request.model, input, max_output_tokens: request.maxOutputTokens, ...(request.tools.length ? { tools: request.tools } : {}), ...(request.structuredOutput ? { text: { format: { type: "json_schema", schema: request.structuredOutput } } } : {}) };
  }
  if (name === "claude") return { model: request.model, max_tokens: request.maxOutputTokens, messages: request.messages.filter((entry) => entry.role !== "system"), ...(request.tools.length ? { tools: request.tools } : {}), ...(request.messages.some((entry) => entry.role === "system") ? { system: request.messages.filter((entry) => entry.role === "system").map((entry) => entry.content).join("\n") } : {}) };
  if (name === "gemini") return { contents: request.messages.filter((entry) => entry.role !== "system").map((entry) => ({ role: entry.role === "assistant" ? "model" : "user", parts: [{ text: entry.content }] })), generationConfig: { maxOutputTokens: request.maxOutputTokens, ...(request.structuredOutput ? { responseMimeType: "application/json", responseSchema: request.structuredOutput } : {}) }, ...(request.tools.length ? { tools: [{ functionDeclarations: request.tools }] } : {}) };
  return { model: request.model, max_tokens: request.maxOutputTokens, messages: request.messages, ...(request.tools.length ? { tools: request.tools } : {}), ...(request.structuredOutput ? { response_format: { type: "json_schema", json_schema: request.structuredOutput } } : {}) };
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

function providerHttpError(provider, status, _payload, headers) {
  const code = status === 401 ? "authentication" : status === 403 ? "authorization" : status === 404 ? "model_unavailable" : status === 408 ? "timeout" : status === 429 ? "rate_limit" : status >= 500 ? "provider_unavailable" : "invalid_request";
  return new ProviderRequestError(`Provider ${provider} request failed with HTTP ${status}.`, { provider, status, retryable: status === 408 || status === 429 || status >= 500, code, retryAfterMs: parseRetryAfter(headers?.get?.("retry-after")) });
}
function parseRetryAfter(value) { if (!value) return null; if (/^\d+(?:\.\d+)?$/.test(value)) return Math.max(0, Math.round(Number(value) * 1000)); const date = Date.parse(value); return Number.isNaN(date) ? null : Math.max(0, date - Date.now()); }
function parseStreamLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  const content = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
  if (content === "[DONE]") return { done: true };
  try { return JSON.parse(content); } catch { throw new ProviderRequestError("Provider stream contained malformed JSON.", { code: "malformed_response", retryable: false }); }
}
function normalizeStreamPayload(name, payload) {
  if (payload.done === true) return [{ type: "complete", finishReason: "stop" }];
  if (name === "ollama") return [...(payload.response ? [{ type: "content-delta", delta: payload.response }] : []), ...(payload.done ? [{ type: "usage", usage: { inputTokens: payload.prompt_eval_count ?? null, outputTokens: payload.eval_count ?? null, totalTokens: null, estimatedCost: null } }, { type: "complete", finishReason: payload.done_reason ?? "stop" }] : [])];
  if (name === "openai") return payload.type === "response.output_text.delta" ? [{ type: "content-delta", delta: payload.delta ?? "" }] : payload.type === "response.completed" ? [{ type: "usage", usage: payload.response?.usage ?? null }, { type: "complete", finishReason: "stop" }] : [];
  if (name === "claude") return payload.type === "content_block_delta" && payload.delta?.text ? [{ type: "content-delta", delta: payload.delta.text }] : payload.type === "message_delta" ? [{ type: "usage", usage: payload.usage ?? null }] : payload.type === "message_stop" ? [{ type: "complete", finishReason: "stop" }] : [];
  if (name === "gemini") return [...(payload.candidates?.[0]?.content?.parts?.map((entry) => ({ type: "content-delta", delta: entry.text ?? "" })) ?? []), ...(payload.usageMetadata ? [{ type: "usage", usage: payload.usageMetadata }] : [])];
  const delta = payload.choices?.[0]?.delta;
  return [...(delta?.content ? [{ type: "content-delta", delta: delta.content }] : []), ...(delta?.tool_calls ? delta.tool_calls.map((toolCall) => ({ type: "tool-call", toolCall })) : []), ...(payload.usage ? [{ type: "usage", usage: payload.usage }] : []), ...(payload.choices?.[0]?.finish_reason ? [{ type: "complete", finishReason: payload.choices[0].finish_reason }] : [])];
}
function normalizeMessages(request) {
  if (Array.isArray(request?.messages) && request.messages.length) return request.messages.map((entry) => ({ role: String(entry.role ?? "user"), content: String(entry.content ?? "") }));
  return request?.prompt === undefined ? [] : [{ role: "user", content: String(request.prompt) }];
}
function safeToRetry(request) { return request.idempotency === "read-only" || request.idempotency === "idempotent"; }
function combineSignals(external, internal) {
  if (!external) return internal;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([external, internal]);
  const controller = new AbortController();
  const abort = () => controller.abort();
  external.addEventListener("abort", abort, { once: true });
  internal.addEventListener("abort", abort, { once: true });
  return controller.signal;
}
