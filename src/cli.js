import path from "node:path";
import process from "node:process";
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
import { initializeProviderProfile, listProviderProfiles, providerStatus } from "./providers.js";

const ADDABLE_MODULES = new Set(supportedModules());

export async function run(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(help());
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
    case "doctor": return printJson(await withLog(root, "doctor", inspectEnvironment(root)), options);
    case "status": return printJson(await readStatus(root), options);
    case "version": return printJson({ workspaceVersion: "0.1.0" }, options);
    case "validate": return printJson(await validateBootstrap(root), options);
    case "help": return console.log(help());
    case "plugins": return printJson({ plugins: [], message: "Plugin execution is deferred to Phase 5; Phase 3 provides readiness and documentation only." }, options);
    case "templates": return printJson({ templates: listTemplates(), installable: false }, options);
    case "config": return printJson(subject ? await setConfig(root, subject, args[2], options) : await loadConfig(root), options);
    case "install": return printJson(await toolCommand(subject, options), options);
    case "reference": return printJson(await referenceCommand(subject, options), options);
    case "providers": return printJson(await providerCommand(root, args.slice(1), options), options);
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
    case "rollback": return printJson(await rollbackProject(root, subject, options), options);
    default: console.log(help());
  }
}

function printJson(value, options = {}) { console.log(JSON.stringify(options.verbose ? { result: value, diagnostics: { dryRun: options.dryRun, nonInteractive: options.nonInteractive, mergePolicy: options.mergePolicy } } : value, null, 2)); }

function help() {
  return `AI Engineering Workspace\n\nAll modifying commands preview changes by default. Add --apply to write files. Existing files are always skipped.\n\nCommands:\n  doctor | init | create <name> | add <module> | remove <module>\n  install [tool] | reference [name] | providers <list|init|status|mcp> [provider]\n  capabilities [name] [preferred-integration]\n  integrations <list|status|doctor|install|init|update|remove|validate|health> [tool]\n  update | status | rollback [operation] | version | help\n  plugins | templates | config [key value]\n\nCreate:\n  create <name> --template <template> [--provider <name>] [--output <path>] [--apply]\n\nSafety options:\n  --dry-run | --apply | --yes | --non-interactive | --verbose | --merge skip|merge|replace | --skip <module-or-path,...>\n  External install/reference actions show scope and require confirmation; use --apply --yes for non-interactive execution.\n  Provider profiles store references only, never keys. Merge and replace requests never overwrite files.\n\nFoundation modules:\n  ${[...ADDABLE_MODULES].join(", ")}`;
}

async function withLog(root, type, promise) { const result = await promise; await logEvent(root, type, { completed: true }); return result; }
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
  if (action === "init") return initializeProviderProfile(root, name, options);
  if (action === "status" || action === "mcp") return providerStatus(root, name);
  throw new Error("Usage: providers <list|init|status|mcp> [provider]");
}
async function integrationCommand(root, args, options = {}) { const [action = "list", name] = args; if (action === "list") return listIntegrations(); if (action === "status" || action === "doctor") return statusIntegrations(root, name); if (action === "install") return recordIntegration(root, name, options); if (action === "init") return initializeIntegrationProject(root, name, options); if (["update", "remove", "validate", "health"].includes(action)) return manageIntegration(root, action, name, options); throw new Error("Usage: integrations <list|status|doctor|install|init|update|remove|validate|health> [tool]"); }
function valueAfter(args, flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
