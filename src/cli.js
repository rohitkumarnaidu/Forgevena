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
import { installPlugin, listPlugins, pluginDependencies, pluginHealth, pluginInstallPlan, pluginPermissions, removePlugin, runtimePluginDefinition, setPluginEnabled, trustPluginPublisher, updatePlugin, validatePlugin } from "./plugins.js";
import { invokeRuntimePlugin } from "./plugin-runtime.js";
import { configureRender, executeRenderDeployment, executeRenderStatus, generateRenderBlueprint, renderDeploymentPlan, renderRollbackPlan, validateRenderBlueprint } from "./render.js";
import { auditCredentialVault, backupCredentials, configureCredential, credentialStatus, initializeCredentialPlaceholders, listCredentialDefinitions, recoverCredential, removeCredential, rotateCredential, validateCredential } from "./credentials.js";
import { cloudActionPlan, cloudRollbackPlan, executeCloudAction, listCloudPlatforms, prepareCloudPlatform, validateCloudPlatform } from "./clouds.js";
import { inspectEcosystem, recordEcosystemHealth } from "./ecosystem-health.js";
import { exportSafeConfiguration, importSafeConfiguration } from "./config-transfer.js";
import { PLATFORM_VERSION, versionInfo } from "./version.js";
import { rollbackUpgrade, upgradeWorkspace } from "./upgrade.js";
import { BRAND } from "./brand.js";
import { parseGlobalOptions, valueAfter } from "./cli/options.js";
import { renderResult } from "./cli/output.js";
import { createApplicationContext } from "./cli/context.js";
import { migrateState, repairState, snapshotState, stateHistory, stateStatus } from "./state-service.js";
import { CommandRouter } from "./cli/router.js";
import { exportBuiltInTemplatePackage, loadTemplatePackage, verifyTemplatePackage } from "./template-packages.js";
import { fetchTemplateCatalog, listTemplateCatalogs, templateCatalogFetchPlan, trustTemplatePublisher, verifyCachedTemplateCatalog } from "./template-catalogs.js";
import { evaluateOrganizationPolicy, importOrganizationPolicy, organizationAudit, organizationComplianceReport, trustOrganizationSigner, validateActiveOrganizationPolicy } from "./org-policy.js";
import { createDiagnosticBundle, diagnosticsHealth, diagnosticsProfile, readMetrics, readTraces } from "./diagnostics.js";
import { generateSupplyChainArtifacts, scanRepositorySecrets, verifySupplyChainArtifacts, verifySupplyChainReadiness } from "./supply-chain.js";
import { engineeringAssetStatus, installEngineeringAsset, listEngineeringAssets, removeEngineeringAsset, trustEngineeringAssetPublisher, verifyEngineeringAsset } from "./engineering-assets.js";
import { loadWorkflow, planWorkflow, resumeWorkflow, startWorkflow, workflowStatus } from "./workflow-engine.js";
import { buildProjectIndex, projectIndexStatus, projectRecommendations, queryProjectIndex } from "./project-index.js";
import { buildSemanticIndex, configureSemanticIndex, querySemanticIndex, semanticIndexPlan, semanticIndexStatus } from "./semantic-index.js";
import { engineeringCopilotPlan, runEngineeringCopilot } from "./engineering-copilot.js";

const ADDABLE_MODULES = new Set(supportedModules());

export async function run(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`${help()}\n\n${releaseHelp()}`);
    return;
  }
  const [command, subject] = args;
  const root = process.cwd();
  const options = parseGlobalOptions(args);
  const context = createApplicationContext(root);
  const request = { args, command, subject, root, options, context };
  return commandRouter().dispatch(command, request);
}

function commandRouter() {
  const output = (value, options) => printJson(value, options);
  return new CommandRouter({ handlers: {
    integrations: async ({ root, args, options }) => output(await integrationCommand(root, args.slice(1), options), options),
    capabilities: ({ subject, args, options }) => output(subject ? resolveCapability(subject, args[2]) : listCapabilities(), options),
    doctor: async ({ root, options }) => output(await doctorCommand(root, options), options),
    status: async ({ root, options }) => output(await readStatus(root), options),
    version: ({ options }) => output(versionInfo(), options),
    validate: async ({ root, options }) => output(await validateBootstrap(root), options),
    state: async ({ context, args, options }) => output(await stateCommand(context, args.slice(1), options), options),
    vault: async ({ root, args, options }) => output(await vaultCommand(root, args.slice(1), options), options),
    help: () => console.log(`${help()}\n\n${releaseHelp()}`),
    plugins: async ({ root, args, options }) => output(await pluginCommand(root, args.slice(1), options), options),
    mcp: async ({ root, args, options }) => output(await mcpCommand(root, args.slice(1), options), options),
    cloud: async ({ root, args, options }) => output(await cloudCommand(root, args.slice(1), options), options),
    credentials: async ({ root, args, options }) => output(await credentialCommand(root, args.slice(1), options), options),
    templates: async ({ root, args, options }) => output(await templateCommand(root, args.slice(1), options), options),
    org: async ({ root, args, options }) => output(await organizationCommand(root, args.slice(1), options), options),
    diagnostics: async ({ root, args, options }) => output(await diagnosticsCommand(root, args.slice(1), options), options),
    "supply-chain": async ({ root, args, options }) => output(await supplyChainCommand(root, args.slice(1), options), options),
    skills: async ({ root, args, options }) => output(await skillsCommand(root, args.slice(1), options), options),
    workflows: async ({ root, args, options }) => output(await workflowsCommand(root, args.slice(1), options), options),
    index: async ({ root, args, options }) => output(await indexCommand(root, args.slice(1), options), options),
    semantic: async ({ root, args, options }) => output(await semanticCommand(root, args.slice(1), options), options),
    copilot: async ({ root, args, options }) => output(await copilotCommand(root, args.slice(1), options), options),
    config: async ({ root, subject, args, options }) => output(subject === "export" ? await exportSafeConfiguration(root, valueAfter(args, "--output"), options) : subject === "import" ? await importSafeConfiguration(root, valueAfter(args, "--input"), options) : subject ? await setConfig(root, subject, args[2], options) : await loadConfig(root), options),
    install: async ({ subject, options }) => output(await toolCommand(subject, options), options),
    reference: async ({ subject, options }) => output(await referenceCommand(subject, options), options),
    providers: async ({ root, args, options }) => output(await providerCommand(root, args.slice(1), options), options),
    dashboard: async ({ root, args, options }) => output(await startDashboard(root, { port: Number(valueAfter(args, "--port") ?? 0) }), options),
    docker: async ({ root, args, options }) => output(await dockerCommand(root, args.slice(1), options), options),
    init: async ({ root, options }) => output(await initializeProject(root, options), options),
    add: async ({ root, subject, options }) => output(await addCommand(root, subject, options), options),
    remove: ({ root, subject, options }) => { validateModule(subject); return output({ root, module: subject, dryRun: true, supported: false, message: "Removal is intentionally disabled to honor the never-delete-user-files safety guarantee." }, options); },
    create: async ({ root, subject, args, options }) => { if (!subject) throw new Error(`Usage: ${BRAND.executable} create <project-name> [--apply]`); return output(await initializeProject(path.resolve(root, valueAfter(args, "--output") ?? subject), { ...options, createProject: true, projectName: subject, template: validateTemplate(valueAfter(args, "--template") ?? "enterprise"), provider: validateProvider(valueAfter(args, "--provider")) }), options); },
    update: async ({ root, options }) => output(await updateProject(root, options), options),
    upgrade: async ({ root, subject, options }) => output(subject === "rollback" ? await rollbackUpgrade(root, options) : await upgradeWorkspace(root, options), options),
    rollback: async ({ root, subject, options }) => output(await rollbackProject(root, subject, options), options),
  }, fallback: () => console.log(`${help()}\n\n${releaseHelp()}`) });
}

async function addCommand(root, subject, options) { if (["openspec", "skillopt", "gstack", "design", "astryx", "claude-mem", "gitnexus", "understand-anything"].includes(subject)) return recordIntegration(root, subject === "design" ? "design-md" : subject, options); validateModule(subject); return addModules(root, [subject], options); }
function validateModule(subject) { if (!ADDABLE_MODULES.has(subject)) throw new Error(`Choose one of: ${[...ADDABLE_MODULES].join(", ")}.`); }

function printJson(value, options = {}) { console.log(renderResult(value, options)); }
function releaseHelp() { return `Release:\n  version (${PLATFORM_VERSION}) | upgrade [rollback]\n\nEngineering intelligence:\n  index <build|status|query|recommend> | semantic <configure|status|plan|build|query> | copilot <plan|run>`; }

function help() {
  return `${BRAND.name}\n${BRAND.caption}\n\nModifying commands preview by default. Use --apply for local writes; external operations also require explicit consent. Existing files are skipped.\n\nCommands:\n  doctor [--apply] | status | validate | version | help\n  state <validate|repair|snapshot|migrate|history> | vault <initialize|rotate|recover|audit>\n  init | create <name> | add <module> | remove <module> | update | rollback [operation]\n  install [tool] | reference [name] | capabilities | integrations\n  credentials <init|list|configure|rotate|validate|status|backup|remove> [name]\n  providers <list|init|configure|status|doctor|validate|update|remove|models|project|mcp|invoke|test|verify|login|logout|limits|dashboard> [provider]\n  mcp <list|add|validate|health|activate|deactivate|remove> [name]\n  plugins <list|install|update|trust|enable|disable|validate|health|remove> [source-or-id]\n  cloud list | cloud <provider> <prepare|validate|verify|deploy|status|health|credentials|rollback>\n  cloud render <generate|validate|credentials|configure|plan|deploy|status|rollback>\n  dashboard [--port <port>] | docker <plan|validate|up|down>\n  templates | config [key value] | config <export|import>\n\nCreate:\n  create <name> --template <template> [--provider <name>] [--output <path>] [--apply]\n\nSafety options:\n  --dry-run | --apply | --yes | --non-interactive | --verbose | --structured | --merge skip|merge|replace | --skip <module-or-path,...>\n  Credential values use masked prompts and are never accepted as command arguments.\n  Existing files are never overwritten; merge and replace requests remain skip-only.\n\nFoundation modules:\n  ${[...ADDABLE_MODULES].join(", ")}\n\nCompatibility:\n  ${BRAND.legacyExecutable} remains supported during the 1.x transition. Project state remains in ${BRAND.stateDirectory}.`;
}

async function withLog(root, type, promise) { const result = await promise; await logEvent(root, type, { completed: true }); return result; }
async function stateCommand(context, args, options) { const [action = "validate"] = args; if (action === "validate") return stateStatus(context.root); if (action === "repair") return repairState(context.root, options); if (action === "snapshot") return snapshotState(context.root, options); if (action === "migrate") return migrateState(context.root, options); if (action === "history") return stateHistory(context.root); throw new Error("Usage: state <validate|repair|snapshot|migrate|history>"); }
async function templateCommand(root, args, options = {}) { const [first, second] = args; const action = !first || first.startsWith("--") ? "list" : first; const manifest = second?.startsWith("--") ? undefined : second; if (action === "list" || action === "catalog") return { templates: listTemplates(), builtIn: true, packageSchemaVersion: 1, catalogs: await listTemplateCatalogs(root) }; if (action === "catalogs") return { catalogs: await listTemplateCatalogs(root), offlineCache: true }; if (action === "trust") { if (!manifest) throw new Error("Usage: templates trust <publisher> --public-key-file <path> [--apply]"); const publicKeyFile = valueAfter(args, "--public-key-file"); if (!publicKeyFile) throw new Error("Use --public-key-file <path-to-public-key.pem>."); return trustTemplatePublisher(root, manifest, await readFile(path.resolve(root, publicKeyFile), "utf8"), options); } if (action === "fetch") { if (!manifest) throw new Error("Usage: templates fetch <https-url> [--apply --yes]"); const plan = templateCatalogFetchPlan(manifest); if (options.dryRun) return { ...plan, dryRun: true }; const approval = await approveExternalAction(plan, options); if (!approval.approved) return { ...plan, approval }; return { ...(await fetchTemplateCatalog(root, manifest, { dryRun: false })), approval }; } if (action === "verify-cache") { if (!manifest) throw new Error("Usage: templates verify-cache <catalog-id>"); return verifyCachedTemplateCatalog(root, manifest); } if (action === "export") { if (!manifest) throw new Error("Usage: templates export <built-in-template> --output <directory> [--apply]"); return exportBuiltInTemplatePackage(path.resolve(root, valueAfter(args, "--output") ?? "template-packages"), manifest, options); } if (["verify", "test"].includes(action)) { if (!manifest) throw new Error(`Usage: templates ${action} <template.json>`); return { action, manifest, ...(await verifyTemplatePackage(path.resolve(root, manifest))) }; } if (action === "inspect") { if (!manifest) throw new Error("Usage: templates inspect <template.json>"); const loaded = await loadTemplatePackage(path.resolve(root, manifest)); return { manifest: loaded.manifest, assets: loaded.assets.map(({ path: target, integrity }) => ({ path: target, integrity })), inheritedFrom: loaded.inheritedFrom }; } throw new Error("Usage: templates <list|catalogs|trust|fetch|verify-cache|export|verify|test|inspect> [subject]"); }
async function organizationCommand(root, args, options = {}) { const [action = "validate", subject] = args; if (action === "trust") { if (!subject) throw new Error("Usage: org trust <signer> --public-key-file <path> [--apply]"); const publicKeyFile = valueAfter(args, "--public-key-file"); if (!publicKeyFile) throw new Error("Use --public-key-file <path-to-public-key.pem>."); return trustOrganizationSigner(root, subject, await readFile(path.resolve(root, publicKeyFile), "utf8"), options); } if (action === "import") { if (!subject) throw new Error("Usage: org import <policy.json> [--apply]"); return importOrganizationPolicy(root, path.resolve(root, subject), options); } if (action === "validate") return validateActiveOrganizationPolicy(root); if (action === "audit") return organizationAudit(root); if (action === "compliance") return organizationComplianceReport(root); if (action === "evaluate") { const principal = valueAfter(args, "--principal"), requestedAction = valueAfter(args, "--action"); if (!principal || !requestedAction) throw new Error("Use --principal <id> --action <action> [--resource <resource>] [--capability <capability>]."); return evaluateOrganizationPolicy(root, { principal, action: requestedAction, resource: valueAfter(args, "--resource") ?? "*", capability: valueAfter(args, "--capability") }); } throw new Error("Usage: org <trust|import|validate|evaluate|audit|compliance>"); }
async function diagnosticsCommand(root, args, options = {}) { const [action = "health"] = args; if (action === "health") return diagnosticsHealth(root); if (action === "metrics") return readMetrics(root); if (action === "traces") return readTraces(root); if (action === "profile") return diagnosticsProfile(root); if (action === "bundle") return createDiagnosticBundle(root, options); throw new Error("Usage: diagnostics <health|bundle|metrics|traces|profile>"); }
async function supplyChainCommand(root, args, options = {}) { const [action = "verify"] = args; if (action === "verify") return verifySupplyChainReadiness(root); if (action === "scan") return scanRepositorySecrets(root); if (action === "generate") return generateSupplyChainArtifacts(root, options); if (action === "artifacts") return verifySupplyChainArtifacts(root); throw new Error("Usage: supply-chain <verify|scan|generate|artifacts>"); }
async function skillsCommand(root, args, options = {}) { const [action = "list", subject, id] = args; if (action === "list") return { assets: await listEngineeringAssets(root, subject) }; if (action === "trust") { if (!subject) throw new Error("Usage: skills trust <publisher> --public-key-file <path> [--apply]"); const publicKeyFile = valueAfter(args, "--public-key-file"); if (!publicKeyFile) throw new Error("Use --public-key-file <path-to-public-key.pem>."); return trustEngineeringAssetPublisher(root, subject, await readFile(path.resolve(root, publicKeyFile), "utf8"), options); } if (action === "verify") { if (!subject) throw new Error("Usage: skills verify <manifest.json>"); return verifyEngineeringAsset(root, path.resolve(root, subject)); } if (action === "install") { if (!subject) throw new Error("Usage: skills install <manifest.json> --principal <id> [--apply]"); return installEngineeringAsset(root, path.resolve(root, subject), { ...options, principal: valueAfter(args, "--principal") }); } if (action === "status") { if (!subject || !id) throw new Error("Usage: skills status <prompt|skill> <id>"); return engineeringAssetStatus(root, subject, id); } if (action === "remove") { if (!subject || !id) throw new Error("Usage: skills remove <prompt|skill> <id> [--apply]"); return removeEngineeringAsset(root, subject, id, options); } throw new Error("Usage: skills <list|trust|verify|install|status|remove>"); }
async function workflowsCommand(root, args, options = {}) { const [action = "plan", subject] = args; if (action === "validate" || action === "plan") { if (!subject) throw new Error(`Usage: workflows ${action} <workflow.json>`); const workflow = await loadWorkflow(path.resolve(root, subject)); return action === "validate" ? { valid: true, workflow: workflow.id, version: workflow.version, order: workflow.order } : planWorkflow(workflow); } if (action === "run") { if (!subject) throw new Error("Usage: workflows run <workflow.json> [--run-id <id>] [--approve <nodes>] [--apply]"); return startWorkflow(root, await loadWorkflow(path.resolve(root, subject)), { runId: valueAfter(args, "--run-id"), approved: parseCsv(valueAfter(args, "--approve")), dryRun: options.dryRun }); } if (action === "status") { if (!subject) throw new Error("Usage: workflows status <run-id>"); return workflowStatus(root, subject); } if (action === "resume") { if (!subject) throw new Error("Usage: workflows resume <run-id> [--approve <nodes>] [--apply]"); if (options.dryRun) return { ...(await workflowStatus(root, subject)), dryRun: true, proposedApprovals: parseCsv(valueAfter(args, "--approve")) }; return resumeWorkflow(root, subject, { approved: parseCsv(valueAfter(args, "--approve")) }); } throw new Error("Usage: workflows <validate|plan|run|resume|status>"); }
async function indexCommand(root, args, options = {}) { const [action = "status"] = args; if (action === "build") return buildProjectIndex(root, options); if (action === "status") return projectIndexStatus(root); if (action === "recommend") return projectRecommendations(root); if (action === "query") { const terms = []; for (let index = 1; index < args.length; index += 1) { if (["--limit", "--query"].includes(args[index])) { index += 1; continue; } if (!args[index].startsWith("--")) terms.push(args[index]); } return queryProjectIndex(root, valueAfter(args, "--query") ?? terms.join(" "), { limit: valueAfter(args, "--limit") }); } throw new Error("Usage: index <build|status|query|recommend> [terms] [--limit <count>]"); }
async function semanticCommand(root, args, options = {}) { const [action = "status"] = args; if (action === "configure") { const metadata = valueAfter(args, "--metadata"); return configureSemanticIndex(root, { enabled: valueAfter(args, "--enabled") === undefined ? undefined : valueAfter(args, "--enabled") === "true", provider: valueAfter(args, "--provider"), model: valueAfter(args, "--model"), metadataFields: metadata === undefined ? undefined : parseCsv(metadata), maxEntries: valueAfter(args, "--max-entries") }, options); } if (action === "status") return semanticIndexStatus(root); if (action === "plan") return semanticIndexPlan(root, valueAfter(args, "--action") ?? "build"); if (action === "build") { const plan = await semanticIndexPlan(root, "build"); if (options.dryRun) return { ...plan, dryRun: true }; const approval = await approveExternalAction(plan, options); if (!approval.approved) return { ...plan, approval }; return { ...(await buildSemanticIndex(root)), approval }; } if (action === "query") { const terms = []; for (let index = 1; index < args.length; index += 1) { if (["--limit", "--query"].includes(args[index])) { index += 1; continue; } if (!args[index].startsWith("--")) terms.push(args[index]); } const query = valueAfter(args, "--query") ?? terms.join(" "); const plan = await semanticIndexPlan(root, "query"); if (options.dryRun) return { ...plan, query, dryRun: true }; const approval = await approveExternalAction(plan, options); if (!approval.approved) return { ...plan, query, approval }; return { ...(await querySemanticIndex(root, query, { limit: valueAfter(args, "--limit") })), approval }; } throw new Error("Usage: semantic <configure|status|plan|build|query>"); }
async function copilotCommand(root, args, options = {}) { const [action = "plan"] = args; const valuedFlags = ["--provider", "--model", "--principal", "--max-output-tokens", "--timeout-ms", "--objective"]; const objective = valueAfter(args, "--objective") ?? positionalText(args, 1, valuedFlags); const settings = { provider: valueAfter(args, "--provider"), model: valueAfter(args, "--model"), principal: valueAfter(args, "--principal"), maxOutputTokens: valueAfter(args, "--max-output-tokens"), timeoutMs: valueAfter(args, "--timeout-ms") }; const plan = await engineeringCopilotPlan(root, objective, settings); if (action === "plan") return plan; if (action === "run") { if (options.dryRun) return { ...plan, dryRun: true }; const approval = await approveExternalAction(plan, options); if (!approval.approved) return { ...plan, approval }; return { ...(await runEngineeringCopilot(root, objective, settings)), approval }; } throw new Error("Usage: copilot <plan|run> <objective> [--provider <name>] [--principal <id>]"); }
async function vaultCommand(root, args, options) { const [action = "audit", name] = args; if (action === "initialize") return initializeCredentialPlaceholders(root, options); if (action === "rotate") return credentialCommand(root, ["rotate", name], options); if (action === "recover") { if (!name) throw new Error("Usage: vault recover <credential> [--apply]"); return recoverCredential(root, name, options); } if (action === "audit") return auditCredentialVault(root); throw new Error("Usage: vault <initialize|rotate|recover|audit> [credential]"); }
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
  if (action === "permissions") return pluginPermissions(root, subject);
  if (action === "dependencies") return pluginDependencies(root, subject);
  if (action === "run") { const definition = await runtimePluginDefinition(root, subject); const method = valueAfter(args, "--method"); if (!method) throw new Error("Use --method <capability>."); if (options.dryRun) return { plugin: subject, method, dryRun: true, executableCode: true, approvalRequired: true }; const approval = await approveExternalAction({ plugin: subject, command: `plugins run ${subject} --method ${method}`, scope: "isolated local plugin process", dataImpact: "Executes the reviewed local plugin with its declared permissions.", affectedPaths: [], rollback: "Stop or disable the plugin." }, options); if (!approval.approved) return { plugin: subject, method, approval }; return { ...(await invokeRuntimePlugin(definition.directory, definition.manifest, method)), approval }; }
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
function positionalText(args, start, valuedFlags) { const values = []; for (let index = start; index < args.length; index += 1) { if (valuedFlags.includes(args[index])) { index += 1; continue; } if (!args[index].startsWith("--")) values.push(args[index]); } return values.join(" "); }
