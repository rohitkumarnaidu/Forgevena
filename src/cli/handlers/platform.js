import path from "node:path";
import { readFile } from "node:fs/promises";
import { inspectEnvironment } from "../../doctor.js";
import { logEvent } from "../../logging.js";
import { inspectEcosystem, recordEcosystemHealth } from "../../ecosystem-health.js";
import { approveExternalAction } from "../../consent.js";
import { installTool, listToolPlans } from "../../tool-adapters.js";
import { addReference, listReferences } from "../../references.js";
import { dockerPlan, executeDockerPlan, validateDockerAssets } from "../../docker.js";
import { readStatus } from "../../project.js";
import {
  initializeIntegrationProject,
  listIntegrations,
  manageIntegration,
  recordIntegration,
  statusIntegrations,
} from "../../integrations.js";
import { listTemplates } from "../../template-catalog.js";
import { exportBuiltInTemplatePackage, loadTemplatePackage, verifyTemplatePackage } from "../../template-packages.js";
import {
  fetchTemplateCatalog,
  listTemplateCatalogs,
  templateCatalogFetchPlan,
  trustTemplatePublisher,
  verifyCachedTemplateCatalog,
} from "../../template-catalogs.js";
import { commandError, valueAfter } from "../options.js";

export async function templateCommand(root, args, options = {}) {
  const [first, second] = args;
  const action = !first || first.startsWith("--") ? "list" : first;
  const manifest = second?.startsWith("--") ? undefined : second;
  if (action === "list" || action === "catalog") return { templates: listTemplates(), builtIn: true, packageSchemaVersion: 1, catalogs: await listTemplateCatalogs(root) };
  if (action === "catalogs") return { catalogs: await listTemplateCatalogs(root), offlineCache: true };
  if (action === "trust") {
    if (!manifest) throw commandError("CLI_TEMPLATE_PUBLISHER_REQUIRED", "Usage: templates trust <publisher> --public-key-file <path> [--apply]", 2);
    const publicKeyFile = valueAfter(args, "--public-key-file");
    if (!publicKeyFile) throw commandError("CLI_TEMPLATE_PUBLIC_KEY_REQUIRED", "Use --public-key-file <path-to-public-key.pem>.", 2);
    return trustTemplatePublisher(root, manifest, await readFile(path.resolve(root, publicKeyFile), "utf8"), options);
  }
  if (action === "fetch") {
    if (!manifest) throw commandError("CLI_TEMPLATE_CATALOG_REQUIRED", "Usage: templates fetch <https-url> [--apply --yes]", 2);
    const plan = templateCatalogFetchPlan(manifest);
    if (options.dryRun) return { ...plan, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await fetchTemplateCatalog(root, manifest, { dryRun: false })), approval };
  }
  if (action === "verify-cache") {
    if (!manifest) throw commandError("CLI_TEMPLATE_CATALOG_REQUIRED", "Usage: templates verify-cache <catalog-id>", 2);
    return verifyCachedTemplateCatalog(root, manifest);
  }
  if (action === "export") {
    if (!manifest) throw commandError("CLI_TEMPLATE_REQUIRED", "Usage: templates export <built-in-template> --output <directory> [--apply]", 2);
    return exportBuiltInTemplatePackage(path.resolve(root, valueAfter(args, "--output") ?? "template-packages"), manifest, options);
  }
  if (action === "verify" || action === "test") {
    if (!manifest) throw commandError("CLI_TEMPLATE_MANIFEST_REQUIRED", `Usage: templates ${action} <template.json>`, 2);
    return { action, manifest, ...(await verifyTemplatePackage(path.resolve(root, manifest))) };
  }
  if (action === "inspect") {
    if (!manifest) throw commandError("CLI_TEMPLATE_MANIFEST_REQUIRED", "Usage: templates inspect <template.json>", 2);
    const loaded = await loadTemplatePackage(path.resolve(root, manifest));
    return { manifest: loaded.manifest, assets: loaded.assets.map(({ path: target, integrity }) => ({ path: target, integrity })), inheritedFrom: loaded.inheritedFrom };
  }
  throw commandError("CLI_TEMPLATE_ACTION_INVALID", "Usage: templates <list|catalogs|trust|fetch|verify-cache|export|verify|test|inspect> [subject]", 2, { action });
}

export async function doctorCommand(root, options) {
  const [environment, ecosystem] = await Promise.all([inspectEnvironment(root), inspectEcosystem(root)]);
  const registry = await recordEcosystemHealth(root, ecosystem, options);
  if (!options?.dryRun) await logEvent(root, "doctor", { completed: true, healthy: ecosystem.healthy, summary: ecosystem.counts });
  return { environment, ecosystem, registry };
}

export async function toolCommand(root, name, options) {
  if (!name) return { tools: listToolPlans(), dryRun: true, message: "Choose a tool to preview its official installation workflow." };
  const preview = await installTool(name, { dryRun: true });
  const approval = await approveExternalAction(preview, options);
  if (!approval.approved) return { ...preview, approval };
  const result = await installTool(name, { dryRun: false });
  await logEvent(root, "install", { type: "tool", name, command: preview.command });
  return { ...result, approval };
}

export async function referenceCommand(root, name, options) {
  if (!name) return { references: listReferences(), dryRun: true, message: "Choose a reference to preview its clone workflow." };
  const preview = await addReference(name, { dryRun: true });
  const approval = await approveExternalAction(preview, options);
  if (!approval.approved) return { ...preview, approval };
  const result = await addReference(name, { dryRun: false });
  await logEvent(root, "install", { type: "reference", name, command: preview.command });
  return { ...result, approval };
}

export async function dockerCommand(root, args, options) {
  const [action = "plan"] = args;
  if (!["plan", "validate", "up", "down"].includes(action)) throw commandError("CLI_DOCKER_ACTION_INVALID", "Usage: docker <plan|validate|up|down>", 2, { action });
  const status = await readStatus(root);
  if (!status.initialized || !status.registry?.template) throw commandError("CLI_DOCKER_PROJECT_REQUIRED", "Initialize or create a workspace project before using Docker commands.", 2);
  if (action === "validate") return validateDockerAssets(root, status.registry.template);
  const plan = await dockerPlan(root, status.registry.template, action === "down" ? "down" : "up");
  if (action === "plan" || options.dryRun) return { ...plan, dryRun: true };
  const approval = await approveExternalAction(plan, options);
  if (!approval.approved) return { ...plan, approval };
  const result = await executeDockerPlan(plan);
  await logEvent(root, "workspace", { command: "docker", action, command: plan.command });
  return { ...result, approval };
}

export async function integrationCommand(root, args, options = {}) {
  const [action = "list", name] = args;
  if (action === "list") return listIntegrations();
  if (action === "status" || action === "doctor") return statusIntegrations(root, name);
  if (action === "install") return recordIntegration(root, name, options);
  if (action === "init") return initializeIntegrationProject(root, name, options);
  if (["update", "remove", "validate", "health"].includes(action)) return manageIntegration(root, action, name, options);
  throw commandError("CLI_INTEGRATION_ACTION_INVALID", "Usage: integrations <list|status|doctor|install|init|update|remove|validate|health> [tool]", 2, { action });
}
