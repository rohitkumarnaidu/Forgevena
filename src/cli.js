import path from "node:path";
import process from "node:process";
import { addModules, initializeProject, readStatus, rollbackProject, updateProject } from "./project.js";
import { loadConfig, setConfig } from "./config.js";
import { supportedModules } from "./modules.js";
import { logEvent } from "./logging.js";
import { recordIntegration } from "./integrations.js";
import { listCapabilities, resolveCapability } from "./capabilities.js";
import { validateProvider, validateTemplate } from "./template-catalog.js";
import { validateBootstrap } from "./bootstrap-validator.js";
import { approveExternalAction } from "./consent.js";
import { configureProviderCredential, initializeProviderProfile, listProviderProfiles, providerStatus, removeProviderProfile } from "./providers.js";
import { startDashboard } from "./dashboard.js";
import { installPlugin, listPlugins, removePlugin, setPluginEnabled, updatePlugin, validatePlugin } from "./plugins.js";
import { exportSafeConfiguration, importSafeConfiguration } from "./config-transfer.js";
import { PLATFORM_VERSION, versionInfo } from "./version.js";
import { rollbackUpgrade, upgradeWorkspace } from "./upgrade.js";
import { BRAND } from "./brand.js";
import { parseGlobalOptions, stripGlobalOptions, valueAfter } from "./cli/options.js";
import { renderResult } from "./cli/output.js";
import { createApplicationContext } from "./cli/context.js";
import { createProviderService } from "./provider-service.js";
import { CommandRouter } from "./cli/router.js";
import { credentialCommand, foundationServices, stateCommand, vaultCommand } from "./cli/handlers/foundation.js";
import { diagnosticsCommand, organizationCommand, supplyChainCommand } from "./cli/handlers/governance.js";
import { copilotCommand, indexCommand, semanticCommand, skillsCommand, workflowsCommand } from "./cli/handlers/engineering.js";
import { doctorCommand, dockerCommand, integrationCommand, referenceCommand, templateCommand, toolCommand } from "./cli/handlers/platform.js";
import { cloudCommand, mcpCommand, pluginCommand, providerCommand } from "./cli/handlers/ecosystem.js";

const ADDABLE_MODULES = new Set(supportedModules());

export async function run(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`${help()}\n\n${releaseHelp()}`);
    return;
  }
  const commandArgs = stripGlobalOptions(args);
  const [command, subject] = commandArgs;
  const root = process.cwd();
  const options = parseGlobalOptions(args);
  const providerService = createProviderService(root);
  const context = createApplicationContext(root, { services: {
    foundation: foundationServices,
    logging: Object.freeze({ logEvent }),
    consent: Object.freeze({ approveExternalAction }),
    providers: providerService,
    plugins: Object.freeze({ installPlugin, listPlugins, removePlugin, setPluginEnabled, updatePlugin, validatePlugin }),
    bootstrap: Object.freeze({ initializeProject, validateBootstrap }),
    registry: Object.freeze({ readStatus }),
  } });
  const request = { args: commandArgs, command, subject, root, options, context };
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
    vault: async ({ context, args, options }) => output(await vaultCommand(context.root, args.slice(1), options, context.services.foundation), options),
    help: () => console.log(`${help()}\n\n${releaseHelp()}`),
    plugins: async ({ root, args, options }) => output(await pluginCommand(root, args.slice(1), options), options),
    mcp: async ({ root, args, options }) => output(await mcpCommand(root, args.slice(1), options), options),
    cloud: async ({ root, args, options }) => output(await cloudCommand(root, args.slice(1), options), options),
    credentials: async ({ context, args, options }) => output(await credentialCommand(context.root, args.slice(1), options, context.services.foundation), options),
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
    install: async ({ root, subject, options }) => output(await toolCommand(root, subject, options), options),
    reference: async ({ root, subject, options }) => output(await referenceCommand(root, subject, options), options),
    providers: async ({ root, args, options, context }) => output(await providerCommand(root, args.slice(1), options, { ...foundationServices, providers: context.services.providers }), options),
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
  return `${BRAND.name}\n${BRAND.caption}\n\nModifying commands preview by default. Use --apply for local writes; external operations also require explicit consent. Existing files are skipped.\n\nCommands:\n  doctor [--apply] | status | validate | version | help\n  state <validate|repair|snapshot|migrate|history> | vault <initialize|rotate|recover|migrate|audit>\n  init | create <name> | add <module> | remove <module> | update | rollback [operation]\n  install [tool] | reference [name] | capabilities | integrations\n  credentials <init|list|configure|rotate|validate|status|backup|remove> [name]\n  providers <list|init|configure|status|doctor|validate|update|remove|models|project|mcp|invoke|stream|cancel|test|verify|login|logout|limits|dashboard> [provider]\n  mcp <list|add|validate|health|activate|deactivate|remove> [name]\n  plugins <list|install|update|trust|enable|disable|validate|health|remove> [source-or-id]\n  cloud list | cloud <provider> <prepare|validate|verify|deploy|status|health|credentials|rollback>\n  cloud render <generate|validate|credentials|configure|plan|deploy|status|rollback>\n  dashboard [--port <port>] | docker <plan|validate|up|down>\n  templates | config [key value] | config <export|import>\n\nProvider invocation:\n  providers invoke <provider> --prompt <text> --apply [--allow-fallback --fallback <provider,...>]\n  providers stream <provider> --prompt <text> --apply [--tools-json <json> --structured-output-json <json>]\n  providers cancel <operation-id>\n\nCreate:\n  create <name> --template <template> [--provider <name>] [--output <path>] [--apply]\n\nSafety options:\n  --dry-run | --apply | --yes | --non-interactive | --verbose | --structured | --merge skip|merge|replace | --skip <module-or-path,...>\n  Credential values use masked prompts and are never accepted as command arguments.\n  Existing files are never overwritten; merge and replace requests remain skip-only.\n\nFoundation modules:\n  ${[...ADDABLE_MODULES].join(", ")}\n\nCompatibility:\n  ${BRAND.legacyExecutable} remains supported during the 1.x transition. Project state remains in ${BRAND.stateDirectory}.`;
}
