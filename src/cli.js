import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import { inspectEnvironment } from "./doctor.js";
import { addModules, initializeProject, readStatus, rollbackProject, updateProject } from "./project.js";
import { loadConfig, setConfig } from "./config.js";
import { supportedModules } from "./modules.js";
import { logEvent } from "./logging.js";
import { initializeIntegrationProject, integrationPlan, listIntegrations, manageIntegration, recordIntegration, statusIntegrations } from "./integrations.js";
import { listCapabilities, resolveCapability } from "./capabilities.js";
import { listTemplates, validateProvider, validateTemplate } from "./template-catalog.js";
import { validateBootstrap } from "./bootstrap-validator.js";
import { approveExternalAction } from "./consent.js";
import { installTool, listToolPlans } from "./tool-adapters.js";
import { addReference, listReferences } from "./references.js";
import { configureProviderCredential, initializeProviderProfile, listProviderProfiles, providerStatus, removeProviderProfile } from "./providers.js";
import { promptSecret } from "./secret-prompt.js";
import { dockerPlan, executeDockerPlan, validateDockerAssets } from "./docker.js";
import { discoverOllamaModels, executeProviderAuth, invokeProvider, providerAuthPlan } from "./provider-runtime.js";
import { configureProjectProviders, readProjectProviderConfig } from "./provider-project.js";
import { readProviderPolicy, setProviderPolicy } from "./provider-policy.js";
import { startDashboard } from "./dashboard.js";
import { executeMcpHealth, listMcpServers, mcpHealthPlan, registerMcpServer, removeMcpServer, setMcpActivation, validateMcpServer } from "./mcp.js";
import { installPlugin, listPlugins, pluginHealth, pluginInstallPlan, removePlugin, setPluginEnabled, trustPluginPublisher, updatePlugin, validatePlugin } from "./plugins.js";
import { configureRender, executeRenderDeployment, executeRenderStatus, generateRenderBlueprint, renderDeploymentPlan, renderRollbackPlan, validateRenderBlueprint } from "./render.js";
import { backupCredentials, configureCredential, credentialStatus, initializeCredentialPlaceholders, listCredentialDefinitions, removeCredential, rotateCredential, validateCredential } from "./credentials.js";
import { cloudActionPlan, cloudRollbackPlan, executeCloudAction, listCloudPlatforms, prepareCloudPlatform, validateCloudPlatform } from "./clouds.js";
import { inspectEcosystem, recordEcosystemHealth } from "./ecosystem-health.js";
import { exportSafeConfiguration, importSafeConfiguration } from "./config-transfer.js";
import { PLATFORM_VERSION, versionInfo } from "./version.js";
import { rollbackUpgrade, upgradeWorkspace } from "./upgrade.js";

const ADDABLE_MODULES = new Set(supportedModules());

export async function run(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`${help()}\n\n${releaseHelp()}`);
    return;
  }
  const [command, subject] = args;
  const root = process.cwd();
  if (args.includes("--apply") && args.includes("--dry-run")) throw new Error("Choose either --apply or --dry-run, not both.");
  const apply = args.includes("--apply") || args.includes("--yes");
  const options = { dryRun: !apply, apply, yes: args.includes("--yes"), force: args.includes("--force"), nonInteractive: args.includes("--non-interactive"), verbose: args.includes("--verbose"), mergePolicy: valueAfter(args, "--merge") ?? "skip", skip: valueAfter(args, "--skip")?.split(",").filter(Boolean) ?? [] };

  switch (command) {
    case "integrations": return printJson(await integrationCommand(root, args.slice(1), options), options);
    case "capabilities": return printJson(subject ? resolveCapability(subject, args[2]) : listCapabilities(), options);
    case "doctor": return printJson(await doctorCommand(root, options), options);
    case "status": return printJson(await readStatus(root), options);
    case "version": return printJson(versionInfo(), options);
    case "validate": return printJson(await validateBootstrap(root), options);
    case "help": return console.log(`${help()}\n\n${releaseHelp()}`);
    case "plugins": return printJson(await pluginCommand(root, args.slice(1), options), options);
    case "mcp": return printJson(await mcpCommand(root, args.slice(1), options), options);
    case "cloud": return printJson(await cloudCommand(root, args.slice(1), options), options);
    case "credentials": return printJson(await credentialCommand(root, args.slice(1), options), options);
    case "templates": return printJson({ templates: listTemplates(), installable: false }, options);
    case "config":
      if (subject === "export") return printJson(await exportSafeConfiguration(root, valueAfter(args, "--output"), options), options);
      if (subject === "import") return printJson(await importSafeConfiguration(root, valueAfter(args, "--input"), options), options);
      return printJson(subject ? await setConfig(root, subject, args[2], options) : await loadConfig(root), options);
    case "install": return printJson(await toolCommand(subject, options), options);
    case "reference": return printJson(await referenceCommand(subject, options), options);
    case "providers": return printJson(await providerCommand(root, args.slice(1), options), options);
    case "dashboard": return printJson(await startDashboard(root, { port: Number(valueAfter(args, "--port") ?? 0) }), options);
    case "docker": return printJson(await dockerCommand(root, args.slice(1), options), options);
    case "init": return printJson(await initializeProject(root, options), options);
    case "add":
      if (["openspec", "skillopt", "gstack", "design", "astryx", "claude-mem", "gitnexus", "understand-anything"].includes(subject)) return printJson(await recordIntegration(root, subject === "design" ? "design-md" : subject, options), options);
      if (!ADDABLE_MODULES.has(subject)) throw new Error(`Choose one of: ${[...ADDABLE_MODULES].join(", ")}.`);
      return printJson(await addModules(root, [subject], options), options);
    case "remove":
      if (!ADDABLE_MODULES.has(subject)) throw new Error(`Choose one of: ${[...ADDABLE_MODULES].join(", ")}.`);
      return printJson({ root, module: subject, dryRun: true, supported: false, message: "Removal is intentionally disabled to honor the never-delete-user-files safety guarantee." }, options);
    case "create":
      if (!subject) throw new Error("Usage: ai-workspace create <project-name> [--apply]");
      return printJson(await initializeProject(path.resolve(root, valueAfter(args, "--output") ?? subject), { ...options, createProject: true, projectName: subject, template: validateTemplate(valueAfter(args, "--template") ?? "enterprise"), provider: validateProvider(valueAfter(args, "--provider")) }), options);
    case "update": return printJson(await updateProject(root, options), options);
    case "upgrade": return printJson(subject === "rollback" ? await rollbackUpgrade(root, options) : await upgradeWorkspace(root, options), options);
    case "rollback": return printJson(await rollbackProject(root, subject, options), options);
    default: console.log(`${help()}\n\n${releaseHelp()}`);
  }
}

function printJson(value, options = {}) { console.log(JSON.stringify(options.verbose ? { result: value, diagnostics: { dryRun: options.dryRun, nonInteractive: options.nonInteractive, mergePolicy: options.mergePolicy } } : value, null, 2)); }
function releaseHelp() { return `Release:\n  version (${PLATFORM_VERSION}) | upgrade [rollback]`; }

function help() {
  return `AI Engineering Workspace\n\nModifying commands preview by default. Use --apply for local writes; external operations also require explicit consent. Existing files are skipped.\n\nCommands:\n  doctor [--apply] | status | validate | version | help\n  init | create <name> | add <module> | remove <module> | update | rollback [operation]\n  install [tool] | reference [name] | capabilities | integrations\n  credentials <init|list|configure|rotate|validate|status|backup|remove> [name]\n  providers <list|init|configure|status|doctor|validate|update|remove|models|project|mcp|invoke|test|verify|login|logout|limits|dashboard> [provider]\n  mcp <list|add|validate|health|activate|deactivate|remove> [name]\n  plugins <list|install|update|trust|enable|disable|validate|health|remove> [source-or-id]\n  cloud list | cloud <provider> <prepare|validate|verify|deploy|status|health|credentials|rollback>\n  cloud render <generate|validate|credentials|configure|plan|deploy|status|rollback>\n  dashboard [--port <port>] | docker <plan|validate|up|down>\n  templates | config [key value] | config <export|import>\n\nCreate:\n  create <name> --template <template> [--provider <name>] [--output <path>] [--apply]\n\nSafety options:\n  --dry-run | --apply | --yes | --non-interactive | --verbose | --merge skip|merge|replace | --skip <module-or-path,...>\n  Credential values use masked prompts and are never accepted as command arguments.\n  Existing files are never overwritten; merge and replace requests remain skip-only.\n\nFoundation modules:\n  ${[...ADDABLE_MODULES].join(", ")}`;
}

async function withLog(root, type, promise) { const result = await promise; await logEvent(root, type, { completed: true }); return result; }
async function doctorCommand(root, options) { const [environment, ecosystem] = await Promise.all([inspectEnvironment(root), inspectEcosystem(root)]); const registry = await recordEcosystemHealth(root, ecosystem, options); await logEvent(root, "doctor", { completed: true, healthy: ecosystem.healthy, summary: ecosystem.counts }); return { environment, ecosystem, registry }; }
async function toolCommand(name, options) {
  if (!name) return { tools: listToolPlans(), dryRun: true, message: "Choose a tool to preview its official installation workflow." };
  const preview = await installTool(name, { dryRun: true });
  const approval = await approveExternalAction(preview, options);
  if (!approval.approved) return { ...preview, approval };
  const result = await installTool(name, { dryRun: false });
  await logEvent(process.cwd(), "install", { type: "tool", name, command: preview.command });
  return { ...result, approval };
}
async function referenceCommand(name, options) {
  if (!name) return { references: listReferences(), dryRun: true, message: "Choose a reference to preview its clone workflow." };
  const preview = await addReference(name, { dryRun: true });
  const approval = await approveExternalAction(preview, options);
  if (!approval.approved) return { ...preview, approval };
  const result = await addReference(name, { dryRun: false });
  await logEvent(process.cwd(), "install", { type: "reference", name, command: preview.command });
  return { ...result, approval };
}
async function providerCommand(root, args, options) {
  const [action = "list", name] = args;
  if (action === "list") return { providers: listProviderProfiles() };
  if (action === "dashboard") return startDashboard(root, { port: Number(valueAfter(args, "--port") ?? 0) });
  if (action === "init") return initializeProviderProfile(root, name, options);
  if (action === "configure") {
    const preview = await configureProviderCredential(root, name, undefined, { dryRun: true });
    if (options.dryRun) return preview;
    if (options.nonInteractive) throw new Error("Provider key entry is intentionally unavailable in non-interactive mode. Set the documented environment variable yourself.");
    const secret = await promptSecret(`Enter ${preview.environmentVariable} for ${name} (input is masked): `);
    return configureProviderCredential(root, name, secret, { dryRun: false });
  }
  if (["status", "mcp", "doctor", "validate", "update"].includes(action)) return providerStatus(root, name);
  if (action === "remove") return removeProviderProfile(root, name, options);
  if (action === "models") {
    if (name !== "ollama") throw new Error("Model discovery is currently available for ollama.");
    return { provider: "ollama", models: await discoverOllamaModels() };
  }
  if (action === "project") {
    const updates = {
      defaultProvider: valueAfter(args, "--default"), fallbackProvider: valueAfter(args, "--fallback"), embeddingProvider: valueAfter(args, "--embedding-provider"),
      model: valueAfter(args, "--model"), embeddingModel: valueAfter(args, "--embedding-model"), temperature: valueAfter(args, "--temperature"),
      maxOutputTokens: valueAfter(args, "--max-output-tokens"), retries: valueAfter(args, "--retries"), timeoutMs: valueAfter(args, "--timeout-ms"), priority: parseCsv(valueAfter(args, "--priority")),
    };
    return Object.values(updates).some((value) => value !== undefined && (!Array.isArray(value) || value.length)) ? configureProjectProviders(root, updates, options) : readProjectProviderConfig(root);
  }
  if (action === "limits") {
    if (!name) throw new Error("Usage: providers limits <provider> [--mode guarded|budgeted|unrestricted]");
    const updates = Object.fromEntries([
      ["mode", valueAfter(args, "--mode")],
      ["maxInputCharacters", valueAfter(args, "--max-input-characters")],
      ["maxOutputTokens", valueAfter(args, "--max-output-tokens")],
      ["timeoutMs", valueAfter(args, "--timeout-ms")],
      ["retries", valueAfter(args, "--retries")],
      ["monthlyRequestLimit", valueAfter(args, "--monthly-request-limit")],
    ].filter(([, value]) => value !== undefined));
    return Object.keys(updates).length ? setProviderPolicy(root, name, updates, options) : readProviderPolicy(root, name);
  }
  if (action === "login" || action === "logout") {
    const plan = providerAuthPlan(name, action);
    if (!plan.supported || options.dryRun) return { ...plan, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await executeProviderAuth(plan)), approval };
  }
  if (action === "invoke" || action === "test" || action === "verify") {
    if (!name) throw new Error(`Usage: providers ${action} <provider> --prompt <text> --apply`);
    const prompt = action === "test" || action === "verify" ? "Reply only with OK." : valueAfter(args, "--prompt");
    if (!prompt) throw new Error("Use --prompt <text>. Avoid placing sensitive data in shell history.");
    const plan = { provider: name, command: `providers ${action} ${name}`, scope: `${name} external provider`, dataImpact: "Sends the supplied prompt to the selected external provider or authenticated agent host.", affectedPaths: ["provider usage ledger only"], rollback: "No remote response can be recalled; revoke credentials or host access if needed." };
    if (options.dryRun) return { ...plan, dryRun: true, promptCharacters: prompt.length, promptLogged: false };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    const result = await invokeProvider(root, name, { prompt, model: valueAfter(args, "--model"), maxOutputTokens: valueAfter(args, "--max-output-tokens"), timeoutMs: valueAfter(args, "--timeout-ms") });
    await logEvent(root, "workspace", { command: "providers", action, provider: name, model: result.model, promptCharacters: prompt.length, responseCharacters: result.text.length, promptLogged: false });
    return { ...result, approval };
  }
  throw new Error("Usage: providers <list|init|configure|status|doctor|validate|update|remove|models|project|mcp|invoke|test|verify|login|logout|limits> [provider]");
}
async function dockerCommand(root, args, options) {
  const [action = "plan"] = args;
  const status = await readStatus(root);
  if (!status.initialized || !status.registry?.template) throw new Error("Initialize or create a workspace project before using Docker commands.");
  if (action === "validate") return validateDockerAssets(root, status.registry.template);
  if (!["plan", "up", "down"].includes(action)) throw new Error("Usage: docker <plan|validate|up|down>");
  const plan = await dockerPlan(root, status.registry.template, action === "down" ? "down" : "up");
  if (action === "plan" || options.dryRun) return { ...plan, dryRun: true };
  const approval = await approveExternalAction(plan, options);
  if (!approval.approved) return { ...plan, approval };
  const result = await executeDockerPlan(plan);
  await logEvent(root, "workspace", { command: "docker", action, command: plan.command });
  return { ...result, approval };
}
async function integrationCommand(root, args, options = {}) { const [action = "list", name] = args; if (action === "list") return listIntegrations(); if (action === "status" || action === "doctor") return statusIntegrations(root, name); if (action === "install") return recordIntegration(root, name, options); if (action === "init") return initializeIntegrationProject(root, name, options); if (["update", "remove", "validate", "health"].includes(action)) return manageIntegration(root, action, name, options); throw new Error("Usage: integrations <list|status|doctor|install|init|update|remove|validate|health> [tool]"); }
async function mcpCommand(root, args, options) {
  const [action = "list", name] = args;
  if (action === "list") return { servers: await listMcpServers(root) };
  if (!name) throw new Error("Usage: mcp <add|validate|health|activate|deactivate|remove> <name>");
  if (action === "add") {
    const transport = valueAfter(args, "--transport") ?? "http";
    return registerMcpServer(root, { name, transport, url: valueAfter(args, "--url"), command: valueAfter(args, "--command"), args: parseJsonOption(args, "--args-json", []), environment: parseCsv(valueAfter(args, "--environment")), headerEnvironment: parseJsonOption(args, "--header-environment-json", {}) }, options);
  }
  if (action === "validate") return validateMcpServer(root, name);
  if (action === "remove") return removeMcpServer(root, name, options);
  if (action === "activate" || action === "deactivate") {
    const plan = await setMcpActivation(root, name, action === "activate", valueAfter(args, "--host"), { dryRun: true });
    if (options.dryRun) return plan;
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await setMcpActivation(root, name, action === "activate", valueAfter(args, "--host"), { dryRun: false })), approval };
  }
  if (action === "health") {
    const plan = await mcpHealthPlan(root, name);
    if (options.dryRun) return { ...plan, serverDefinition: undefined, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, serverDefinition: undefined, approval };
    return { ...(await executeMcpHealth(plan)), approval };
  }
  throw new Error("Usage: mcp <list|add|validate|health|activate|deactivate|remove> [name]");
}
async function pluginCommand(root, args, options) {
  const [action = "list", subject] = args;
  if (action === "list") return { plugins: await listPlugins(root) };
  if (!subject) throw new Error("Usage: plugins <install|trust|enable|disable|validate|remove> <source-or-id>");
  if (action === "trust") {
    const publicKeyFile = valueAfter(args, "--public-key-file");
    if (!publicKeyFile) throw new Error("Use --public-key-file <path-to-public-key.pem>.");
    const publicKeyPem = await readFile(path.resolve(root, publicKeyFile), "utf8");
    return trustPluginPublisher(root, subject, publicKeyPem, options);
  }
  if (action === "install") {
    const plan = await pluginInstallPlan(subject);
    if (options.dryRun) return { ...plan, dryRun: true };
    if (plan.remote) {
      const approval = await approveExternalAction(plan, options);
      if (!approval.approved) return { ...plan, approval };
      return { ...(await installPlugin(root, subject, { dryRun: false })), approval };
    }
    return installPlugin(root, subject, { dryRun: false });
  }
  if (action === "update") {
    const plan = await pluginInstallPlan(subject);
    if (options.dryRun) return { ...plan, action: "update", dryRun: true };
    if (plan.remote) { const approval = await approveExternalAction(plan, options); if (!approval.approved) return { ...plan, approval }; return { ...(await updatePlugin(root, subject, { dryRun: false })), approval }; }
    return updatePlugin(root, subject, { dryRun: false });
  }
  if (action === "enable" || action === "disable") return setPluginEnabled(root, subject, action === "enable", options);
  if (action === "validate") return validatePlugin(root, subject);
  if (action === "health") return pluginHealth(root, subject);
  if (action === "remove") return removePlugin(root, subject, options);
  throw new Error("Usage: plugins <list|install|update|trust|enable|disable|validate|health|remove> [source-or-id]");
}
async function cloudCommand(root, args, options) {
  const [provider = "render", action = "plan"] = args;
  if (provider === "list") return { clouds: [{ name: "render", product: "Render", deploymentAutomatic: false }, ...listCloudPlatforms()] };
  if (provider !== "render") {
    if (action === "prepare" || action === "generate") return prepareCloudPlatform(root, provider, options);
    if (action === "validate" || action === "health") return validateCloudPlatform(root, provider);
    if (action === "rollback") return cloudRollbackPlan(root, provider);
    if (action === "credentials") return configureCredentialInteractively(root, provider, options);
    if (["verify", "deploy", "status"].includes(action)) {
      const plan = await cloudActionPlan(root, provider, action);
      if (options.dryRun || !plan.ready) return { ...plan, dryRun: true };
      const approval = await approveExternalAction(plan, options);
      if (!approval.approved) return { ...plan, approval };
      const result = await executeCloudAction(root, plan);
      await logEvent(root, "workspace", { command: "cloud", provider, action, executed: true });
      return { ...result, approval };
    }
    throw new Error("Usage: cloud <provider> <prepare|validate|verify|deploy|status|health|credentials|rollback>.");
  }
  if (action === "generate") return generateRenderBlueprint(root, options);
  if (action === "validate") return validateRenderBlueprint(root);
  if (action === "credentials") return configureCredentialInteractively(root, "render", options);
  if (action === "configure") return configureRender(root, { serviceIds: parseCsv(valueAfter(args, "--service-ids")), workspaceId: valueAfter(args, "--workspace-id"), dryRun: options.dryRun });
  if (action === "rollback") return renderRollbackPlan(root);
  if (!["plan", "deploy", "status"].includes(action)) throw new Error("Usage: cloud render <generate|validate|credentials|configure|plan|deploy|status|rollback>");
  const plan = await renderDeploymentPlan(root, action === "plan" ? "deploy" : action);
  if (action === "plan" || options.dryRun || !plan.executable) return { ...plan, dryRun: true };
  const approval = await approveExternalAction(plan, options);
  if (!approval.approved) return { ...plan, approval };
  const result = action === "status" ? await executeRenderStatus(root, plan) : await executeRenderDeployment(root, plan);
  await logEvent(root, "workspace", { command: "cloud", provider: "render", action, services: plan.serviceIds.length });
  return { ...result, approval };
}
async function credentialCommand(root, args, options) {
  const [action = "list", name] = args;
  const allStatuses = () => Promise.all(listCredentialDefinitions().map(({ name: credential }) => credentialStatus(root, credential)));
  if (action === "list") return { credentials: await allStatuses() };
  if (action === "init") return initializeCredentialPlaceholders(root, options);
  if (action === "status") return name ? credentialStatus(root, name) : { credentials: await allStatuses() };
  if (action === "configure") return configureCredentialInteractively(root, name, options);
  if (action === "validate") return name ? validateCredential(root, name) : { credentials: await Promise.all(listCredentialDefinitions().map(({ name: credential }) => validateCredential(root, credential))) };
  if (action === "backup") return backupCredentials(root, options);
  if (action === "remove") return removeCredential(root, name, options);
  if (action === "rotate") {
    const preview = await rotateCredential(root, name, undefined, { dryRun: true, storage: valueAfter(args, "--storage") ?? "local" });
    if (options.dryRun || preview.manualRequired) return preview;
    if (options.nonInteractive) throw new Error("Credential rotation requires masked interactive input or an external secret manager.");
    const secret = await promptSecret(`Enter the replacement credential for ${name} (input is masked): `);
    return rotateCredential(root, name, secret, { dryRun: false, storage: valueAfter(args, "--storage") ?? "local" });
  }
  throw new Error("Usage: credentials <init|list|configure|rotate|validate|status|backup|remove> [provider-or-cloud]");
}
async function configureCredentialInteractively(root, name, options) {
  if (!name) throw new Error("Choose a provider credential or render.");
  const preview = await configureCredential(root, name, undefined, { dryRun: true });
  if (options.dryRun) return preview;
  if (options.nonInteractive) throw new Error(`Masked ${preview.environmentVariable} entry is unavailable in non-interactive mode. Set the environment variable through your secret manager.`);
  const secret = await promptSecret(`Enter ${preview.environmentVariable} for ${name} (input is masked): `);
  return configureCredential(root, name, secret, { dryRun: false, storage: valueAfter(process.argv.slice(2), "--storage") ?? "local" });
}
function parseJsonOption(args, flag, fallback) { const value = valueAfter(args, flag); if (value === undefined) return fallback; try { return JSON.parse(value); } catch { throw new Error(`${flag} must contain valid JSON.`); } }
function parseCsv(value) { return value?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? []; }
function valueAfter(args, flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
