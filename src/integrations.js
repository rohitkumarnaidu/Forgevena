import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { PLATFORM_VERSION } from "./version.js";
import path from "node:path";

const integrations = {
  openspec: { kind: "cli", install: "npm install -g @fission-ai/openspec@latest", project: "openspec init", artifacts: ["openspec"], scope: "global CLI plus project specification files", dataImpact: "The official CLI may write project specification files after separate user approval.", rollback: "Use the upstream CLI and review generated specification files manually." },
  skillopt: { kind: "python-package", install: "pip install skillopt", artifacts: [".skillopt", "best_skill.md"], scope: "Python environment and project skill artifacts", dataImpact: "Training may use the model provider configured by the user.", rollback: "Remove only project artifacts you own; uninstall the package through pip if desired." },
  gstack: { kind: "agent-skill", manual: "Clone upstream gstack and run ./setup --host codex (or another supported host).", artifacts: [".agents/skills/gstack"], scope: "selected agent host", dataImpact: "Host-specific skill setup may modify agent configuration.", rollback: "Use upstream host-specific removal guidance." },
  "design-md": { kind: "project-artifact", install: "npx @google/design.md lint DESIGN.md", artifacts: ["DESIGN.md"], scope: "project design document", dataImpact: "Linting reads DESIGN.md and may download the package through npx.", rollback: "The workspace creates only an absent DESIGN.md template." },
  astryx: { kind: "reference", manual: "Evaluate the upstream repository and licensing before adopting components.", artifacts: [], scope: "reference material", dataImpact: "No project changes are made by the workspace.", rollback: "No workspace rollback is required." },
  "claude-mem": { kind: "agent-plugin", install: "npx claude-mem install", artifacts: [".claude-mem"], scope: "agent host and local memory", dataImpact: "The plugin may persist local agent context.", rollback: "Use the upstream plugin removal guidance." },
  gitnexus: { kind: "project-cli", install: "npx gitnexus analyze", artifacts: [".gitnexus"], scope: "repository analysis", dataImpact: "Analysis may create a local repository index.", rollback: "Remove only the reviewed local index through the upstream workflow." },
  "understand-anything": { kind: "agent-plugin", manual: "Use the upstream plugin marketplace or platform installer for the selected AI agent.", artifacts: [".understand-anything"], scope: "agent host and repository index", dataImpact: "The plugin may read and index the selected repository.", rollback: "Use the upstream plugin removal guidance." }
};

export function listIntegrations() { return Object.entries(integrations).map(([name, value]) => ({ name, ...value })); }
export async function statusIntegrations(root, requested) {
  const names = requested ? [requested] : Object.keys(integrations);
  return Promise.all(names.map(async (name) => {
    const integration = integrations[name];
    if (!integration) throw new Error(`Unknown integration: ${name}`);
    const artifacts = Object.fromEntries(await Promise.all(integration.artifacts.map(async (artifact) => [artifact, await exists(path.join(root, artifact))])));
    return { name, kind: integration.kind, artifacts, health: Object.values(artifacts).some(Boolean) ? "detected" : "not-initialized" };
  }));
}
export function integrationPlan(name) { const integration = integrations[name]; if (!integration) throw new Error(`Unknown integration: ${name}`); return { name, ...integration, dryRun: true, confirmation: "Official workflow preview only. Re-run with a supported adapter apply action when implemented." }; }
export async function recordIntegration(root, name, { dryRun = true } = {}) {
  const plan = integrationPlan(name);
  if (dryRun) return plan;
  const registryPath = path.join(root, ".ai-workspace", "workspace.json");
  let registry;
  try { registry = JSON.parse(await readFile(registryPath, "utf8")); } catch { registry = { initialized: true, workspaceVersion: PLATFORM_VERSION, modules: [], integrations: {} }; }
  registry.integrations ??= {};
  registry.integrations[name] = { kind: integrations[name].kind, installationMethod: integrations[name].install ?? "official-manual-workflow", scope: integrations[name].scope, dataImpact: integrations[name].dataImpact, rollback: integrations[name].rollback, consentRequired: true, configurationStatus: "pending", health: "not-validated", initializedAt: new Date().toISOString(), lastValidation: null };
  await mkdir(path.dirname(registryPath), { recursive: true });
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  return { ...plan, dryRun: false, registered: true };
}
export async function manageIntegration(root, action, name, { dryRun = true } = {}) {
  const plan = integrationPlan(name);
  const registryPath = path.join(root, ".ai-workspace", "workspace.json");
  let registry;
  try { registry = JSON.parse(await readFile(registryPath, "utf8")); } catch { throw new Error("Initialize the project before managing integrations."); }
  const current = registry.integrations?.[name];
  if (!current) throw new Error(`${name} is not registered in this project.`);
  const status = (await statusIntegrations(root, name))[0];
  const next = { ...current, health: status.health, lastValidation: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (action === "remove") {
    if (dryRun) return { ...plan, action, dryRun: true, scope: "Removes registry state only; never deletes external tools or project files." };
    delete registry.integrations[name];
  } else {
    if (dryRun) return { ...plan, action, dryRun: true, health: status.health };
    registry.integrations[name] = next;
  }
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  return { name, action, dryRun: false, health: status.health, registryUpdated: true };
}
export async function initializeIntegrationProject(root, name, { dryRun = true } = {}) {
  const integration = integrations[name];
  if (!integration) throw new Error(`Unknown integration: ${name}`);
  const files = projectTemplates(name);
  const create = [];
  const skipped = [];
  for (const entry of files) ((await exists(path.join(root, entry.path))) ? skipped : create).push(entry);
  if (dryRun) return { name, dryRun: true, create: create.map((item) => item.path), skipped: skipped.map((item) => item.path) };
  for (const entry of create) { const target = path.join(root, entry.path); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, entry.contents); }
  return { name, dryRun: false, created: create.map((item) => item.path), skipped: skipped.map((item) => item.path) };
}
function projectTemplates(name) {
  if (name === "design-md") return [{ path: "DESIGN.md", contents: "---\nname: Project Design System\ncolors:\n  primary: '#1A1C1E'\n---\n\n## Overview\nDefine the project visual identity.\n" }];
  if (name === "skillopt") return [{ path: ".skillopt/README.md", contents: "# SkillOpt\n\nKeep optimized skills and training artifacts isolated to this project.\n" }];
  if (name === "openspec") return [{ path: "docs/integrations/openspec.md", contents: "# OpenSpec\n\nRun the official `openspec init` command after reviewing its proposed changes.\n" }];
  return [{ path: `docs/integrations/${name}.md`, contents: `# ${name}\n\nFollow the registered official integration workflow.\n` }];
}
async function exists(target) { try { await access(target); return true; } catch { return false; } }
