import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_OUTPUT_BYTES = 256 * 1024;

export class PluginRuntimeError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "PluginRuntimeError"; this.code = code; this.details = details; }
}

export function validateRuntimeManifest(manifest, pluginDirectory) {
  if (manifest?.schemaVersion !== 2 || manifest.type !== "runtime") throw new PluginRuntimeError("PLUGIN_MANIFEST_INVALID", "Runtime plugins require schemaVersion 2 and type runtime.");
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(manifest.id ?? "")) throw new PluginRuntimeError("PLUGIN_ID_INVALID", "Plugin id must use 1-64 safe characters.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) throw new PluginRuntimeError("PLUGIN_VERSION_INVALID", "Plugin version must use semantic versioning.");
  const entry = path.resolve(pluginDirectory, manifest.entry ?? "");
  const root = path.resolve(pluginDirectory);
  if (!manifest.entry || (entry !== root && !entry.startsWith(`${root}${path.sep}`))) throw new PluginRuntimeError("PLUGIN_ENTRY_INVALID", "Plugin entry must remain inside its installation directory.");
  const permissions = [...new Set((manifest.permissions ?? []).map(String))];
  const allowed = new Set(["workspace:read", "workspace:write-managed", "provider:invoke", "network:http", "audit:write"]);
  if (permissions.some((permission) => !allowed.has(permission))) throw new PluginRuntimeError("PLUGIN_PERMISSION_INVALID", "Plugin requests an unsupported permission.");
  return { schemaVersion: 2, type: "runtime", id: manifest.id, version: manifest.version, entry, permissions, capabilities: [...new Set((manifest.capabilities ?? []).map(String))], timeoutMs: positiveLimit(manifest.timeoutMs, DEFAULT_TIMEOUT_MS, 60_000), maxOutputBytes: positiveLimit(manifest.maxOutputBytes, DEFAULT_OUTPUT_BYTES, 1024 * 1024) };
}

export class PluginRuntimeHost {
  constructor({ spawnImpl = spawn } = {}) { this.spawnImpl = spawnImpl; this.sessions = new Map(); }

  async start(pluginDirectory, manifest) {
    const plugin = validateRuntimeManifest(manifest, pluginDirectory);
    if (this.sessions.has(plugin.id)) throw new PluginRuntimeError("PLUGIN_ALREADY_RUNNING", `Plugin ${plugin.id} is already running.`);
    const child = spawnPlugin(this.spawnImpl, pluginDirectory, plugin);
    const session = { child, plugin, pending: new Map(), startedAt: new Date().toISOString(), outputBytes: 0, stderr: "", stopped: false };
    this.sessions.set(plugin.id, session);
    child.stderr.on("data", (chunk) => { session.stderr = `${session.stderr}${chunk}`.slice(-4096); });
    child.stdout.on("data", (chunk) => { session.outputBytes += chunk.length; if (session.outputBytes > plugin.maxOutputBytes) this.#fail(session, new PluginRuntimeError("PLUGIN_OUTPUT_LIMIT", `Plugin ${plugin.id} exceeded its output limit.`)); });
    session.lines = readline.createInterface({ input: child.stdout });
    session.lines.on("line", (line) => this.#handleLine(session, line));
    child.on("error", (error) => this.#fail(session, new PluginRuntimeError("PLUGIN_START_FAILED", error.message)));
    child.on("exit", (code) => this.#fail(session, new PluginRuntimeError("PLUGIN_EXITED", `Plugin ${plugin.id} exited with code ${code}.`, { stderr: session.stderr, code })));
    await new Promise((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
    return this.status(plugin.id);
  }

  async invoke(id, method, params = {}) {
    const session = this.sessions.get(id);
    if (!session || session.stopped) throw new PluginRuntimeError("PLUGIN_NOT_RUNNING", `Plugin ${id} is not running.`);
    if (!session.plugin.capabilities.includes(method)) throw new PluginRuntimeError("PLUGIN_CAPABILITY_DENIED", `Plugin ${id} does not declare capability ${method}.`);
    const request = { jsonrpc: "2.0", id: randomUUID(), method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { session.pending.delete(request.id); reject(new PluginRuntimeError("PLUGIN_TIMEOUT", `Plugin ${id} exceeded ${session.plugin.timeoutMs}ms.`)); }, session.plugin.timeoutMs);
      session.pending.set(request.id, { resolve, reject, timer, method });
      session.child.stdin.write(`${JSON.stringify(request)}\n`, (error) => { if (error) this.#settle(session, request.id, new PluginRuntimeError("PLUGIN_RPC_WRITE_FAILED", error.message)); });
    });
  }

  async stop(id) {
    const session = this.sessions.get(id);
    if (!session) return { plugin: id, running: false, stopped: false };
    session.stopped = true;
    session.lines.close();
    for (const requestId of session.pending.keys()) this.#settle(session, requestId, new PluginRuntimeError("PLUGIN_STOPPED", `Plugin ${id} stopped before responding.`));
    if (!session.child.killed) session.child.kill();
    this.sessions.delete(id);
    return { plugin: id, running: false, stopped: true };
  }

  async reload(pluginDirectory, manifest) { await this.stop(manifest.id); return this.start(pluginDirectory, manifest); }
  status(id) { const session = this.sessions.get(id); return session ? { plugin: id, version: session.plugin.version, running: true, pid: session.child.pid, startedAt: session.startedAt, permissions: session.plugin.permissions, credentialsExposed: false } : { plugin: id, running: false }; }

  #handleLine(session, line) {
    let response;
    try { response = JSON.parse(line); } catch { return this.#fail(session, new PluginRuntimeError("PLUGIN_RPC_INVALID", "Plugin returned malformed JSON-RPC.")); }
    if (response.jsonrpc !== "2.0" || !session.pending.has(response.id)) return this.#fail(session, new PluginRuntimeError("PLUGIN_RPC_INVALID", "Plugin response id or protocol version is invalid."));
    if (response.error) return this.#settle(session, response.id, new PluginRuntimeError("PLUGIN_RPC_ERROR", response.error.message ?? "Plugin returned an error.", { pluginError: response.error }));
    const pending = session.pending.get(response.id);
    this.#settle(session, response.id, null, { plugin: session.plugin.id, version: session.plugin.version, method: pending.method, result: response.result, permissions: session.plugin.permissions, secretEnvironmentPassed: false });
  }

  #settle(session, requestId, error, value) { const pending = session.pending.get(requestId); if (!pending) return; clearTimeout(pending.timer); session.pending.delete(requestId); error ? pending.reject(error) : pending.resolve(value); }
  #fail(session, error) { if (session.stopped) return; session.stopped = true; for (const requestId of session.pending.keys()) this.#settle(session, requestId, error); if (!session.child.killed) session.child.kill(); this.sessions.delete(session.plugin.id); }
}

export async function invokeRuntimePlugin(pluginDirectory, manifest, method, params = {}, { spawnImpl = spawn } = {}) {
  const plugin = validateRuntimeManifest(manifest, pluginDirectory);
  if (!plugin.capabilities.includes(method)) throw new PluginRuntimeError("PLUGIN_CAPABILITY_DENIED", `Plugin ${plugin.id} does not declare capability ${method}.`);
  const request = { jsonrpc: "2.0", id: randomUUID(), method, params };
  const child = spawnPlugin(spawnImpl, pluginDirectory, plugin);
  return new Promise((resolve, reject) => {
    let outputBytes = 0;
    let settled = false;
    let stderr = "";
    const timer = setTimeout(() => finish(new PluginRuntimeError("PLUGIN_TIMEOUT", `Plugin ${plugin.id} exceeded ${plugin.timeoutMs}ms.`)), plugin.timeoutMs);
    const lines = readline.createInterface({ input: child.stdout });
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); lines.close(); if (!child.killed) child.kill(); error ? reject(error) : resolve(value); };
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4096); });
    child.stdout.on("data", (chunk) => { outputBytes += chunk.length; if (outputBytes > plugin.maxOutputBytes) finish(new PluginRuntimeError("PLUGIN_OUTPUT_LIMIT", `Plugin ${plugin.id} exceeded its output limit.`)); });
    lines.on("line", (line) => {
      let response;
      try { response = JSON.parse(line); } catch { return finish(new PluginRuntimeError("PLUGIN_RPC_INVALID", "Plugin returned malformed JSON-RPC.")); }
      if (response.jsonrpc !== "2.0" || response.id !== request.id) return finish(new PluginRuntimeError("PLUGIN_RPC_INVALID", "Plugin response id or protocol version is invalid."));
      if (response.error) return finish(new PluginRuntimeError("PLUGIN_RPC_ERROR", response.error.message ?? "Plugin returned an error.", { pluginError: response.error }));
      finish(null, { plugin: plugin.id, version: plugin.version, method, result: response.result, permissions: plugin.permissions, secretEnvironmentPassed: false });
    });
    child.on("error", (error) => finish(new PluginRuntimeError("PLUGIN_START_FAILED", error.message)));
    child.on("exit", (code) => { if (!settled) finish(new PluginRuntimeError("PLUGIN_EXITED", `Plugin exited before responding with code ${code}.`, { stderr })); });
    child.stdin.end(`${JSON.stringify(request)}\n`);
  });
}

function spawnPlugin(spawnImpl, pluginDirectory, plugin) { return spawnImpl(process.execPath, ["--permission", `--allow-fs-read=${path.resolve(pluginDirectory)}`, plugin.entry], { cwd: path.resolve(pluginDirectory), windowsHide: true, stdio: ["pipe", "pipe", "pipe"], env: { FORGEVENA_PLUGIN_ID: plugin.id, FORGEVENA_PLUGIN_VERSION: plugin.version, NODE_NO_WARNINGS: "1" } }); }

function positiveLimit(value, fallback, maximum) { const number = Number(value ?? fallback); if (!Number.isInteger(number) || number <= 0 || number > maximum) throw new PluginRuntimeError("PLUGIN_LIMIT_INVALID", `Plugin limits must be positive integers no greater than ${maximum}.`); return number; }
