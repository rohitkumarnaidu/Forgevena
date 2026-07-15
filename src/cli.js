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
    case "integrations": return printJson(await integrationCommand(root, args.slice(1), options));
    case "capabilities": return printJson(subject ? resolveCapability(subject, args[2]) : listCapabilities());
    case "doctor": return printJson(await withLog(root, "doctor", inspectEnvironment(root)));
    case "status": return printJson(await readStatus(root));
    case "version": return printJson({ workspaceVersion: "0.1.0" });
    case "validate": return printJson(await validateBootstrap(root));
    case "help": return console.log(help());
    case "plugins": return printJson({ plugins: [], message: "Plugin execution is deferred; Phase 2 provides the extension directory and module contract." });
    case "templates": return printJson({ templates: listTemplates(), installable: false });
    case "config": return printJson(subject ? await setConfig(root, subject, args[2], options) : await loadConfig(root));
    case "init": return printJson(await initializeProject(root, options));
    case "add":
      if (["openspec", "skillopt", "gstack", "design", "astryx", "claude-mem", "gitnexus", "understand-anything"].includes(subject)) return printJson(await recordIntegration(root, subject === "design" ? "design-md" : subject, options));
      if (!ADDABLE_MODULES.has(subject)) throw new Error(`Choose one of: ${[...ADDABLE_MODULES].join(", ")}.`);
      return printJson(await addModules(root, [subject], options));
    case "remove":
      if (!ADDABLE_MODULES.has(subject)) throw new Error(`Choose one of: ${[...ADDABLE_MODULES].join(", ")}.`);
      return printJson({ root, module: subject, dryRun: true, supported: false, message: "Removal is intentionally disabled in Phase 2 to honor the never-delete-user-files safety guarantee." });
    case "create":
      if (!subject) throw new Error("Usage: ai-workspace create <project-name> [--apply]");
      return printJson(await initializeProject(path.resolve(root, valueAfter(args, "--output") ?? subject), { ...options, createProject: true, projectName: subject, template: validateTemplate(valueAfter(args, "--template") ?? "enterprise"), provider: validateProvider(valueAfter(args, "--provider")) }));
    case "update": return printJson(await updateProject(root, options));
    case "rollback": return printJson(await rollbackProject(root, subject, options));
    default: console.log(help());
  }
}

function printJson(value) { console.log(JSON.stringify(value, null, 2)); }

function help() {
  return `AI Engineering Workspace\n\nAll modifying commands preview changes by default. Add --apply to write files. Existing files are always skipped.\n\nCommands:\n  doctor | init | create <name> | add <module> | remove <module>\n  capabilities [name] [preferred-integration]\n  integrations <list|status|doctor|install|update|remove> [tool]\n  update | status | rollback [backup] | version | help\n  plugins | templates | config [key value]\n\nCreate:\n  create <name> --template <react|nextjs|fastapi|express|python> [--provider <name>] [--output <path>] [--apply]\n\nInit options:\n  --dry-run | --apply | --merge skip|merge|replace | --skip <module-or-path,...>\n  Merge and replace requests are reported, but never overwrite files.\n\nFoundation modules:\n  ${[...ADDABLE_MODULES].join(", ")}`;
}

async function withLog(root, type, promise) { const result = await promise; await logEvent(root, type, { completed: true }); return result; }
async function integrationCommand(root, args, options = {}) { const [action = "list", name] = args; if (action === "list") return listIntegrations(); if (action === "status" || action === "doctor") return statusIntegrations(root, name); if (action === "install") return recordIntegration(root, name, options); if (action === "init") return initializeIntegrationProject(root, name, options); if (["update", "remove", "validate", "health"].includes(action)) return manageIntegration(root, action, name, options); throw new Error("Usage: integrations <list|status|doctor|install|init|update|remove|validate|health> [tool]"); }
function valueAfter(args, flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
