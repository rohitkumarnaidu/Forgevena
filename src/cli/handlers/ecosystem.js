import path from "node:path";
import { readFile } from "node:fs/promises";
import { approveExternalAction } from "../../consent.js";
import { logEvent } from "../../logging.js";
import { configureProviderCredential, initializeProviderProfile, listProviderProfiles, providerStatus, removeProviderProfile } from "../../providers.js";
import { discoverOllamaModels, executeProviderAuth, invokeProvider, providerAuthPlan } from "../../provider-runtime.js";
import { configureProjectProviders, readProjectProviderConfig } from "../../provider-project.js";
import { readProviderPolicy, setProviderPolicy } from "../../provider-policy.js";
import { startDashboard } from "../../dashboard.js";
import { executeMcpHealth, listMcpServers, mcpHealthPlan, registerMcpServer, removeMcpServer, setMcpActivation, validateMcpServer } from "../../mcp.js";
import { installPlugin, listPlugins, pluginDependencies, pluginHealth, pluginInstallPlan, pluginPermissions, removePlugin, runtimePluginDefinition, setPluginEnabled, trustPluginPublisher, updatePlugin, validatePlugin } from "../../plugins.js";
import { invokeRuntimePlugin } from "../../plugin-runtime.js";
import { configureRender, executeRenderDeployment, executeRenderStatus, generateRenderBlueprint, renderDeploymentPlan, renderRollbackPlan, validateRenderBlueprint } from "../../render.js";
import { cloudActionPlan, cloudRollbackPlan, executeCloudAction, listCloudPlatforms, prepareCloudPlatform, validateCloudPlatform } from "../../clouds.js";
import { commandError, parseCsv, valueAfter } from "../options.js";
import { credentialCommand, foundationServices } from "./foundation.js";

export async function providerCommand(root, args, options, services = foundationServices) {
  const [action = "list", name] = args;
  if (action === "list") return { providers: listProviderProfiles() };
  if (action === "dashboard") return startDashboard(root, { port: Number(valueAfter(args, "--port") ?? 0) });
  if (action === "init") return initializeProviderProfile(root, name, options);
  if (action === "configure") {
    const preview = await configureProviderCredential(root, name, undefined, { dryRun: true });
    if (options.dryRun) return preview;
    if (options.nonInteractive) throw commandError("CLI_PROVIDER_INTERACTIVE_REQUIRED", "Provider key entry is intentionally unavailable in non-interactive mode. Set the documented environment variable yourself.", 2);
    const secret = await services.promptSecret(`Enter ${preview.environmentVariable} for ${name} (input is masked): `);
    return configureProviderCredential(root, name, secret, { dryRun: false });
  }
  if (["status", "mcp", "doctor", "validate", "update"].includes(action)) return providerStatus(root, name);
  if (action === "remove") return removeProviderProfile(root, name, options);
  if (action === "models") {
    if (name !== "ollama") throw commandError("CLI_PROVIDER_MODELS_UNSUPPORTED", "Model discovery is currently available for ollama.", 2, { provider: name });
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
    if (!name) throw commandError("CLI_PROVIDER_REQUIRED", "Usage: providers limits <provider> [--mode guarded|budgeted|unrestricted]", 2);
    const updates = Object.fromEntries([
      ["mode", valueAfter(args, "--mode")], ["maxInputCharacters", valueAfter(args, "--max-input-characters")],
      ["maxOutputTokens", valueAfter(args, "--max-output-tokens")], ["timeoutMs", valueAfter(args, "--timeout-ms")],
      ["retries", valueAfter(args, "--retries")], ["monthlyRequestLimit", valueAfter(args, "--monthly-request-limit")],
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
    if (!name) throw commandError("CLI_PROVIDER_REQUIRED", `Usage: providers ${action} <provider> --prompt <text> --apply`, 2);
    const prompt = action === "test" || action === "verify" ? "Reply only with OK." : valueAfter(args, "--prompt");
    if (!prompt) throw commandError("CLI_PROVIDER_PROMPT_REQUIRED", "Use --prompt <text>. Avoid placing sensitive data in shell history.", 2);
    const plan = { provider: name, command: `providers ${action} ${name}`, scope: `${name} external provider`, dataImpact: "Sends the supplied prompt to the selected external provider or authenticated agent host.", affectedPaths: ["provider usage ledger only"], rollback: "No remote response can be recalled; revoke credentials or host access if needed." };
    if (options.dryRun) return { ...plan, dryRun: true, promptCharacters: prompt.length, promptLogged: false };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    const result = await invokeProvider(root, name, { prompt, model: valueAfter(args, "--model"), maxOutputTokens: valueAfter(args, "--max-output-tokens"), timeoutMs: valueAfter(args, "--timeout-ms") });
    await logEvent(root, "workspace", { command: "providers", action, provider: name, model: result.model, promptCharacters: prompt.length, responseCharacters: result.text.length, promptLogged: false });
    return { ...result, approval };
  }
  throw commandError("CLI_PROVIDER_ACTION_INVALID", "Usage: providers <list|init|configure|status|doctor|validate|update|remove|models|project|mcp|invoke|test|verify|login|logout|limits> [provider]", 2, { action });
}

export async function mcpCommand(root, args, options) {
  const [action = "list", name] = args;
  if (action === "list") return { servers: await listMcpServers(root) };
  if (!name) throw commandError("CLI_MCP_SERVER_REQUIRED", "Usage: mcp <add|validate|health|activate|deactivate|remove> <name>", 2);
  if (action === "add") return registerMcpServer(root, { name, transport: valueAfter(args, "--transport") ?? "http", url: valueAfter(args, "--url"), command: valueAfter(args, "--command"), args: parseJsonOption(args, "--args-json", []), environment: parseCsv(valueAfter(args, "--environment")), headerEnvironment: parseJsonOption(args, "--header-environment-json", {}) }, options);
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
  throw commandError("CLI_MCP_ACTION_INVALID", "Usage: mcp <list|add|validate|health|activate|deactivate|remove> [name]", 2, { action });
}

export async function pluginCommand(root, args, options) {
  const [action = "list", subject] = args;
  if (action === "list") return { plugins: await listPlugins(root) };
  if (!subject) throw commandError("CLI_PLUGIN_REQUIRED", "Usage: plugins <install|trust|enable|disable|validate|remove> <source-or-id>", 2);
  if (action === "trust") {
    const publicKeyFile = valueAfter(args, "--public-key-file");
    if (!publicKeyFile) throw commandError("CLI_PLUGIN_PUBLIC_KEY_REQUIRED", "Use --public-key-file <path-to-public-key.pem>.", 2);
    return trustPluginPublisher(root, subject, await readFile(path.resolve(root, publicKeyFile), "utf8"), options);
  }
  if (action === "install" || action === "update") {
    const plan = await pluginInstallPlan(subject);
    if (options.dryRun) return { ...plan, ...(action === "update" ? { action } : {}), dryRun: true };
    const execute = action === "update" ? updatePlugin : installPlugin;
    if (!plan.remote) return execute(root, subject, { dryRun: false });
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await execute(root, subject, { dryRun: false })), approval };
  }
  if (action === "enable" || action === "disable") return setPluginEnabled(root, subject, action === "enable", options);
  if (action === "validate") return validatePlugin(root, subject);
  if (action === "health") return pluginHealth(root, subject);
  if (action === "permissions") return pluginPermissions(root, subject);
  if (action === "dependencies") return pluginDependencies(root, subject);
  if (action === "run") {
    const definition = await runtimePluginDefinition(root, subject);
    const method = valueAfter(args, "--method");
    if (!method) throw commandError("CLI_PLUGIN_METHOD_REQUIRED", "Use --method <capability>.", 2);
    if (options.dryRun) return { plugin: subject, method, dryRun: true, executableCode: true, approvalRequired: true };
    const approval = await approveExternalAction({ plugin: subject, command: `plugins run ${subject} --method ${method}`, scope: "isolated local plugin process", dataImpact: "Executes the reviewed local plugin with its declared permissions.", affectedPaths: [], rollback: "Stop or disable the plugin." }, options);
    if (!approval.approved) return { plugin: subject, method, approval };
    return { ...(await invokeRuntimePlugin(definition.directory, definition.manifest, method)), approval };
  }
  if (action === "remove") return removePlugin(root, subject, options);
  throw commandError("CLI_PLUGIN_ACTION_INVALID", "Usage: plugins <list|install|update|trust|enable|disable|validate|health|permissions|dependencies|run|remove> [source-or-id]", 2, { action });
}

export async function cloudCommand(root, args, options, services = foundationServices) {
  const [provider = "render", action = "plan"] = args;
  if (provider === "list") return { clouds: [{ name: "render", product: "Render", deploymentAutomatic: false }, ...listCloudPlatforms()] };
  if (provider !== "render") {
    if (action === "prepare" || action === "generate") return prepareCloudPlatform(root, provider, options);
    if (action === "validate" || action === "health") return validateCloudPlatform(root, provider);
    if (action === "rollback") return cloudRollbackPlan(root, provider);
    if (action === "credentials") return credentialCommand(root, ["configure", provider, ...args.slice(2)], options, services);
    if (["verify", "deploy", "status"].includes(action)) {
      const plan = await cloudActionPlan(root, provider, action);
      if (options.dryRun || !plan.ready) return { ...plan, dryRun: true };
      const approval = await approveExternalAction(plan, options);
      if (!approval.approved) return { ...plan, approval };
      const result = await executeCloudAction(root, plan);
      await logEvent(root, "workspace", { command: "cloud", provider, action, executed: true });
      return { ...result, approval };
    }
    throw commandError("CLI_CLOUD_ACTION_INVALID", "Usage: cloud <provider> <prepare|validate|verify|deploy|status|health|credentials|rollback>.", 2, { provider, action });
  }
  if (action === "generate") return generateRenderBlueprint(root, options);
  if (action === "validate") return validateRenderBlueprint(root);
  if (action === "credentials") return credentialCommand(root, ["configure", "render", ...args.slice(2)], options, services);
  if (action === "configure") return configureRender(root, { serviceIds: parseCsv(valueAfter(args, "--service-ids")), workspaceId: valueAfter(args, "--workspace-id"), dryRun: options.dryRun });
  if (action === "rollback") return renderRollbackPlan(root);
  if (!["plan", "deploy", "status"].includes(action)) throw commandError("CLI_RENDER_ACTION_INVALID", "Usage: cloud render <generate|validate|credentials|configure|plan|deploy|status|rollback>", 2, { action });
  const plan = await renderDeploymentPlan(root, action === "plan" ? "deploy" : action);
  if (action === "plan" || options.dryRun || !plan.executable) return { ...plan, dryRun: true };
  const approval = await approveExternalAction(plan, options);
  if (!approval.approved) return { ...plan, approval };
  const result = action === "status" ? await executeRenderStatus(root, plan) : await executeRenderDeployment(root, plan);
  await logEvent(root, "workspace", { command: "cloud", provider: "render", action, services: plan.serviceIds.length });
  return { ...result, approval };
}

function parseJsonOption(args, flag, fallback) {
  const value = valueAfter(args, flag);
  if (value === undefined) return fallback;
  try { return JSON.parse(value); }
  catch { throw commandError("CLI_JSON_OPTION_INVALID", `${flag} must contain valid JSON.`, 2, { flag }); }
}
