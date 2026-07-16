import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { PLATFORM_VERSION } from "./version.js";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const REGISTRY_PATH = path.join(".ai-workspace", "mcp", "servers.json");

export async function listMcpServers(root) {
  const registry = await readRegistry(root);
  return Object.values(registry.servers).sort((left, right) => left.name.localeCompare(right.name));
}

export async function registerMcpServer(root, definition, { dryRun = true } = {}) {
  const server = validateDefinition(definition);
  const registry = await readRegistry(root);
  const existing = registry.servers[server.name];
  if (existing) return { server: server.name, dryRun, created: false, skipped: true, message: "Server already exists and was not overwritten.", existing };
  const plan = { server: server.name, dryRun, create: [REGISTRY_PATH], definition: redact(server), enabled: false };
  if (dryRun) return plan;
  registry.servers[server.name] = { ...server, enabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await writeRegistry(root, registry);
  return { ...plan, dryRun: false, created: true };
}

export async function validateMcpServer(root, name) {
  const server = await getServer(root, name);
  const issues = [];
  try { validateDefinition(server); } catch (error) { issues.push(error.message); }
  const missingEnvironment = Object.values(server.headerEnvironment ?? {}).filter((variable) => !process.env[variable]);
  return { server: name, valid: issues.length === 0 && missingEnvironment.length === 0, issues, missingEnvironment, enabled: server.enabled };
}

export async function setMcpActivation(root, name, enabled, host, { dryRun = true } = {}) {
  const registry = await readRegistry(root);
  const server = registry.servers[name];
  if (!server) throw new Error(`Unknown MCP server: ${name}.`);
  const generated = host ? path.join(".ai-workspace", "mcp", "generated", `${host}-${name}.${host === "codex" ? "toml" : "json"}`) : null;
  const plan = { server: name, enabled, host: host ?? null, dryRun, command: `mcp ${enabled ? "activate" : "deactivate"} ${name}${host ? ` for ${host}` : ""}`, scope: "project MCP registry and generated host configuration", update: [REGISTRY_PATH], create: generated ? [generated] : [], dataImpact: enabled ? "Allows the selected host to connect to the declared MCP server when the generated configuration is adopted." : "Disables the project registry entry; host configuration may still require manual removal.", affectedPaths: [REGISTRY_PATH, ...(generated ? [generated] : [])], rollback: "Deactivate the server and remove adopted host configuration manually." };
  if (dryRun) return plan;
  server.enabled = enabled;
  server.updatedAt = new Date().toISOString();
  server.hosts = { ...(server.hosts ?? {}), ...(host ? { [host]: enabled ? "generated" : "disabled" } : {}) };
  await writeRegistry(root, registry);
  let generatedResult = null;
  if (generated && enabled) generatedResult = await writeGeneratedHostConfig(root, generated, host, server);
  return { ...plan, dryRun: false, generated: generatedResult };
}

export async function removeMcpServer(root, name, { dryRun = true } = {}) {
  const registry = await readRegistry(root);
  const server = registry.servers[name];
  if (!server) return { server: name, dryRun, removed: false, message: "Server is not registered." };
  const plan = { server: name, dryRun, registryOnly: true, generatedFilesPreserved: true };
  if (dryRun) return plan;
  delete registry.servers[name];
  await writeRegistry(root, registry);
  return { ...plan, dryRun: false, removed: true };
}

export async function mcpHealthPlan(root, name) {
  const server = await getServer(root, name);
  return { server: name, transport: server.transport, command: server.transport === "http" ? `MCP initialize ${server.url}` : `Check executable ${server.command}`, scope: server.transport === "http" ? "remote MCP endpoint" : "local executable discovery", dataImpact: server.transport === "http" ? "Sends MCP client metadata and authentication headers sourced from environment-variable references." : "Checks whether the configured executable is available.", affectedPaths: [], rollback: "Health checks do not persist remote changes.", serverDefinition: server };
}

export async function executeMcpHealth(plan, { fetchImpl = globalThis.fetch, execImpl = executeFile, retries = 2, timeoutMs = 15000 } = {}) {
  const server = plan.serverDefinition;
  if (server.transport === "stdio") {
    try {
      const locator = process.platform === "win32" ? "where.exe" : "which";
      await execImpl(locator, [server.command], { windowsHide: true, timeout: 5000 });
      return { server: server.name, healthy: true, transport: "stdio", executableAvailable: true };
    } catch {
      return { server: server.name, healthy: false, transport: "stdio", executableAvailable: false };
    }
  }
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  for (const [header, variable] of Object.entries(server.headerEnvironment ?? {})) {
    const value = process.env[variable];
    if (!value) throw new Error(`Missing ${variable} for MCP header ${header}.`);
    headers[header] = value;
  }
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(server.url, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "ai-workspace", version: PLATFORM_VERSION } } }), signal: AbortSignal.timeout(timeoutMs) });
      if (response.ok || (response.status < 500 && response.status !== 429)) return { server: server.name, healthy: response.ok, transport: "http", status: response.status, attempts: attempt + 1 };
      lastError = new Error(`MCP health failed with HTTP ${response.status}.`);
    } catch (error) { lastError = error; }
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, Math.min(250 * (2 ** attempt), 2000)));
  }
  return { server: server.name, healthy: false, transport: "http", status: null, attempts: retries + 1, error: lastError?.message ?? "MCP health failed." };
}

function validateDefinition(value) {
  const name = String(value?.name ?? "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name)) throw new Error("MCP server name must be 1-64 safe characters.");
  const transport = value.transport === "https" ? "http" : value.transport;
  if (!["stdio", "http"].includes(transport)) throw new Error("MCP transport must be stdio or http.");
  if (transport === "stdio" && !String(value.command ?? "").trim()) throw new Error("stdio MCP servers require a command.");
  if (transport === "stdio" && (value.args ?? []).some((argument) => /(?:api[-_]?key|token|secret|authorization)=|\bsk-[A-Za-z0-9]/i.test(String(argument)))) throw new Error("MCP command arguments must not contain inline credentials; use environment-variable references.");
  if (transport === "http") {
    const url = new URL(value.url);
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("Remote MCP servers require HTTPS; HTTP is allowed only for loopback endpoints.");
    if (url.username || url.password || [...url.searchParams.keys()].some((key) => /key|token|secret|auth/i.test(key))) throw new Error("MCP URLs must not contain inline credentials; use header environment-variable references.");
  }
  const headerEnvironment = Object.fromEntries(Object.entries(value.headerEnvironment ?? {}).map(([header, variable]) => {
    if (!/^[A-Za-z0-9-]+$/.test(header) || !/^[A-Z][A-Z0-9_]*$/.test(variable)) throw new Error("MCP headers must reference valid uppercase environment-variable names.");
    return [header, variable];
  }));
  return { name, transport, ...(transport === "stdio" ? { command: String(value.command).trim(), args: Array.isArray(value.args) ? value.args.map(String) : [], environment: Array.isArray(value.environment) ? value.environment.map(String) : [] } : { url: String(value.url), headerEnvironment }) };
}

function redact(server) { return { ...server, headerEnvironment: server.headerEnvironment ?? {}, storesSecrets: false }; }
async function getServer(root, name) { const server = (await readRegistry(root)).servers[name]; if (!server) throw new Error(`Unknown MCP server: ${name}.`); return server; }
async function readRegistry(root) { try { const value = JSON.parse(await readFile(path.join(root, REGISTRY_PATH), "utf8")); return { schemaVersion: 1, servers: {}, ...value }; } catch { return { schemaVersion: 1, servers: {} }; } }
async function writeRegistry(root, registry) { const target = path.join(root, REGISTRY_PATH); await mkdir(path.dirname(target), { recursive: true }); registry.updatedAt = new Date().toISOString(); await writeFile(target, `${JSON.stringify(registry, null, 2)}\n`, "utf8"); }
async function writeGeneratedHostConfig(root, relative, host, server) {
  const target = path.join(root, relative);
  try { await access(target); return { created: false, skipped: true, path: relative }; } catch {}
  const content = host === "codex" ? codexConfig(server) : `${JSON.stringify({ mcpServers: { [server.name]: hostConfig(server) } }, null, 2)}\n`;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  return { created: true, skipped: false, path: relative };
}
function hostConfig(server) { return server.transport === "stdio" ? { command: server.command, args: server.args, env: Object.fromEntries((server.environment ?? []).map((name) => [name, `\${${name}}`])) } : { url: server.url, headers: Object.fromEntries(Object.entries(server.headerEnvironment ?? {}).map(([header, variable]) => [header, `\${${variable}}`])) }; }
function codexConfig(server) { if (server.transport === "http") return `[mcp_servers.${server.name}]\nurl = "${server.url}"\n# Configure bearer_token_env_var or headers in your trusted Codex configuration.\n`; return `[mcp_servers.${server.name}]\ncommand = "${server.command.replaceAll('"', '\\"')}"\nargs = ${JSON.stringify(server.args ?? [])}\n`; }
