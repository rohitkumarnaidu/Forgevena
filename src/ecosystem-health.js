import { listCredentialDefinitions, validateCredential } from "./credentials.js";
import { listCloudPlatforms, validateCloudPlatform } from "./clouds.js";
import { listMcpServers, validateMcpServer } from "./mcp.js";
import { listPlugins, validatePlugin } from "./plugins.js";
import { providerStatus } from "./providers.js";
import { validateBootstrap } from "./bootstrap-validator.js";
import { validateRenderBlueprint } from "./render.js";
import path from "node:path";
import { writeStateDocument } from "./state-documents.js";

export async function inspectEcosystem(root) {
  const checkedAt = new Date().toISOString();
  const [providers, credentials, clouds, mcpServers, plugins, workspace, render] = await Promise.all([
    providerStatus(root),
    Promise.all(listCredentialDefinitions().map(({ name }) => validateCredential(root, name))),
    Promise.all(listCloudPlatforms().map(({ name }) => validateCloudPlatform(root, name))),
    listMcpServers(root),
    listPlugins(root),
    validateBootstrap(root),
    validateRenderBlueprint(root),
  ]);
  const mcp = await Promise.all(mcpServers.map(({ name }) => validateMcpServer(root, name)));
  const pluginHealth = await Promise.all(plugins.map(({ id }) => validatePlugin(root, id)));
  const sections = {
    providers: providers.map((item) => ({ name: item.provider, healthy: providerHealthy(item), status: item })),
    credentials: credentials.map((item) => ({ name: item.credential, healthy: item.valid, status: item })),
    clouds: [{ name: "render", healthy: render.valid, status: render }, ...clouds.map((item) => ({ name: item.cloud, healthy: item.valid, status: item }))],
    mcp: mcp.map((item) => ({ name: item.server, healthy: item.valid, status: item })),
    plugins: pluginHealth.map((item) => ({ name: item.plugin, healthy: item.valid, status: item })),
    workspace: [{ name: "bootstrap", healthy: workspace.valid, status: workspace }],
  };
  const summary = Object.values(sections).flat();
  return { checkedAt, healthy: summary.every(({ healthy }) => healthy), counts: { total: summary.length, healthy: summary.filter(({ healthy }) => healthy).length, attention: summary.filter(({ healthy }) => !healthy).length }, sections };
}

function providerHealthy(item) {
  if (item.runtime.kind === "local-model") return item.runtime.healthy === true;
  if (item.runtime.kind === "agent-host") return item.runtime.executableAvailable === true;
  return item.credentialAvailable === true;
}

export async function recordEcosystemHealth(root, health, { dryRun = true } = {}) {
  const relative = path.join(".ai-workspace", "health.json");
  const snapshot = { schemaVersion: 1, ...health };
  if (dryRun) return { dryRun: true, path: relative, summary: health.counts };
  await writeStateDocument(root, relative, snapshot);
  return { dryRun: false, path: relative, recorded: true, summary: health.counts };
}
