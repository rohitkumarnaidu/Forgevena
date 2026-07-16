import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { detectProject, inspectEnvironment } from "./doctor.js";
import { moduleFiles } from "./templates.js";
import { moduleContract } from "./modules.js";
import { loadConfig } from "./config.js";
import { logEvent } from "./logging.js";
import { validateBootstrap } from "./bootstrap-validator.js";
import { templateAssets } from "./template-catalog.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { PLATFORM_VERSION, REGISTRY_SCHEMA_VERSION } from "./version.js";

const DEFAULT_MODULES = ["core", "doctor", "registry", "logging", "config", "templates", "providers", "project", "docs"];
const NEW_PROJECT_MODULES = ["bootstrap", ...DEFAULT_MODULES, "design", "ai", "github", "testing", "docker", "monitoring"];
const ROOT = ".ai-workspace";
const REGISTRY = "workspace.json";
const MANIFEST = "managed-assets.json";

export async function initializeProject(root, { dryRun = true, createProject = false, projectName, template = "enterprise", provider = null, mergePolicy = "skip", skip = [] } = {}) {
  if (createProject && await directoryHasEntries(root)) throw new Error("Project destination is not empty. Use `ai init` inside an existing repository so application files remain protected.");
  const project = await detectProject(root);
  const modules = createProject ? NEW_PROJECT_MODULES : DEFAULT_MODULES;
  if (!["skip", "merge", "replace"].includes(mergePolicy)) throw new Error("Merge policy must be skip, merge, or replace.");
  const result = await addModules(root, modules, { dryRun, initialize: true, createProject, projectName, template, provider, project, mergePolicy, skip });
  return { ...result, projectReport: { mode: createProject ? "new-project" : "existing-project", detectedFrameworks: project.frameworks, existingSignals: Object.entries(project.flags).filter(([, present]) => present).map(([name]) => name), mergePolicy: { requested: mergePolicy, effective: "skip", reason: "Workspace policy never overwrites existing files." }, protectedDirectories: ["src", "backend", "frontend"] } };
}

export async function addModules(root, modules, { dryRun = true, initialize = false, createProject = false, projectName, template, provider, project, mergePolicy = "skip", skip = [] } = {}) {
  const detectedProject = project ?? await detectProject(root);
  const selectedModules = modules.filter((moduleName) => !skip.includes(moduleName) && !skip.includes(`module:${moduleName}`));
  const files = [...(createProject ? templateAssets(template ?? "enterprise").map((asset) => ({ relative: asset.path, contents: asset.contents })) : []), ...selectedModules.flatMap((moduleName) => moduleContract(moduleName).install())];
  const report = await planFiles(root, files, skip);
  const preview = { root, dryRun, initialize, createProject, detectedProject, modules: selectedModules, create: report.create.map(({ relative }) => relative), skipped: report.skipped, ignored: report.ignored, duplicateAssets: report.duplicates, merge: { requested: mergePolicy, effective: "skip", reason: "Existing files are never overwritten." }, confirmation: dryRun ? "Preview only. Re-run with --apply to create listed files." : "Applied additively; existing files were skipped." };
  if (dryRun) return preview;

  const transaction = await beginTransaction(root);
  const created = [];
  try {
    if (createProject) await mkdir(root, { recursive: true });
    for (const entry of report.create) {
      await mkdir(path.dirname(entry.target), { recursive: true });
      await writeFile(entry.target, entry.contents, "utf8");
      created.push(entry.target);
    }
    if (createProject) await initializeGit(root);
    const registry = await getRegistry(root);
    registry.schemaVersion ??= REGISTRY_SCHEMA_VERSION;
    registry.workspaceVersion = PLATFORM_VERSION;
    registry.projectName ??= projectName ?? path.basename(root);
    registry.template ??= template ?? "enterprise";
    registry.providers = [...new Set([...(registry.providers ?? []), ...(provider ? [provider] : [])])];
    registry.modules = [...new Set([...registry.modules, ...selectedModules])].sort();
    registry.detectedStack = detectedProject.frameworks;
    registry.bootstrapMode = createProject ? "new-project" : "existing-project";
    registry.toolVersions = Object.fromEntries((await inspectEnvironment(root)).tools.filter((tool) => tool.installed).map((tool) => [tool.name, tool.version]));
    registry.updatedAt = new Date().toISOString();
    await writeRegistry(root, registry);
    await recordManagedOperation(root, {
      id: transaction.id,
      command: createProject ? "create" : initialize ? "init" : "add",
      created: report.create.map((entry) => ({ relative: entry.relative, hash: hashContents(entry.contents) })),
      registryBackup: transaction.registryBackup ? path.basename(transaction.registryBackup) : null,
      manifestBackup: transaction.manifestBackup ? path.basename(transaction.manifestBackup) : null,
    });
    await logEvent(root, "workspace", { command: "init", modules: selectedModules, created: report.create.map((entry) => entry.relative), skipped: report.skipped }, (await loadConfig(root)).logRetentionDays);
    return { ...preview, dryRun: false, created: report.create.map((entry) => entry.relative), transaction: transaction.id, validation: await validateBootstrap(root, { mode: createProject ? "new-project" : "existing-project", template }) };
  } catch (error) {
    await Promise.all(created.reverse().map((file) => rm(file, { force: true })));
    await restoreRegistry(root, transaction.registryBackup);
    await restoreManifest(root, transaction.manifestBackup);
    await logEvent(root, "error", { operation: "init", message: error.message });
    throw error;
  }
}

export async function updateProject(root, { dryRun = true } = {}) {
  if (!(await registryExists(root))) throw new Error("No AI Workspace registry found. Run init first.");
  const registry = await getRegistry(root);
  return addModules(root, registry.modules, { dryRun, initialize: false, project: await detectProject(root) });
}

export async function rollbackProject(root, requestedOperation, { dryRun = true, yes = false } = {}) {
  const manifest = await getManagedManifest(root);
  const operation = requestedOperation ? manifest.operations.find((item) => item.id === requestedOperation) : manifest.operations.at(-1);
  if (!operation) throw new Error("No managed bootstrap operation is available for rollback.");
  if (operation.id !== manifest.operations.at(-1)?.id) throw new Error("Only the latest managed operation can be rolled back. Roll back newer operations first.");
  const removable = [];
  const modified = [];
  const missing = [];
  for (const asset of operation.created) {
    const target = path.join(root, asset.relative);
    if (!(await fileExists(target))) { missing.push(asset.relative); continue; }
    const contents = await readFile(target, "utf8");
    if (hashContents(contents) === asset.hash) removable.push({ ...asset, target });
    else modified.push(asset.relative);
  }
  const result = {
    root,
    operation: operation.id,
    dryRun,
    removable: removable.map((asset) => asset.relative),
    modified,
    missing,
    scope: "Only unchanged, manifest-owned assets may be removed. Existing or modified files are preserved.",
  };
  if (dryRun) return { ...result, confirmation: "Preview only. Re-run with --apply --yes to remove only the listed unchanged assets." };
  if (!yes) throw new Error("Rollback removes managed files and requires --yes together with --apply.");
  for (const asset of removable) await rm(asset.target, { force: true });
  const remaining = manifest.operations.filter((item) => item.id !== operation.id);
  await writeManagedManifest(root, { ...manifest, operations: remaining, updatedAt: new Date().toISOString() });
  await restoreRegistry(root, operation.registryBackup ? path.join(root, ROOT, "backups", operation.registryBackup) : null);
  await logEvent(root, "rollback", { operation: operation.id, removed: removable.map((asset) => asset.relative), modified, missing });
  return { ...result, dryRun: false, restored: true };
}

export async function readStatus(root) {
  const initialized = await registryExists(root);
  if (!initialized) return { root, initialized: false, registry: null, project: await detectProject(root), logs: [], backups: [] };
  const registry = await getRegistry(root);
  return { root, initialized: true, registry, project: await detectProject(root), logs: await directoryEntries(path.join(root, ROOT, "logs")), backups: await directoryEntries(path.join(root, ROOT, "backups")) };
}

async function planFiles(root, files, skip) {
  const create = [];
  const skipped = [];
  const ignored = [];
  const duplicates = [];
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file.relative)) { duplicates.push(file.relative); continue; }
    seen.add(file.relative);
    if (skip.includes(file.relative)) { ignored.push(file.relative); continue; }
    const target = path.join(root, file.relative);
    if (await fileExists(target)) skipped.push(file.relative);
    else create.push({ ...file, target });
  }
  return { create, skipped, ignored, duplicates };
}

async function beginTransaction(root) {
  const backupDirectory = path.join(root, ROOT, "backups");
  await mkdir(backupDirectory, { recursive: true });
  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const registryBackup = await backupFile(path.join(root, ROOT, REGISTRY), path.join(backupDirectory, `workspace-${id}.json`));
  const manifestBackup = await backupFile(path.join(root, ROOT, MANIFEST), path.join(backupDirectory, `manifest-${id}.json`));
  return { id, registryBackup, manifestBackup };
}

async function getRegistry(root) {
  try { return normalizeRegistry(JSON.parse(await readFile(path.join(root, ROOT, REGISTRY), "utf8"))); }
  catch { return normalizeRegistry({ initialized: true, workspaceVersion: PLATFORM_VERSION, createdAt: new Date().toISOString() }); }
}
async function registryExists(root) { return fileExists(path.join(root, ROOT, REGISTRY)); }
async function writeRegistry(root, registry) { await mkdir(path.join(root, ROOT), { recursive: true }); await writeFile(path.join(root, ROOT, REGISTRY), `${JSON.stringify(registry, null, 2)}\n`, "utf8"); }
async function restoreRegistry(root, backup) { if (backup) await cp(backup, path.join(root, ROOT, REGISTRY)); else await rm(path.join(root, ROOT, REGISTRY), { force: true }); }
async function restoreManifest(root, backup) { if (backup) await cp(backup, path.join(root, ROOT, MANIFEST)); else await rm(path.join(root, ROOT, MANIFEST), { force: true }); }
async function fileExists(filePath) { try { return (await stat(filePath)).isFile(); } catch { return false; } }
async function directoryHasEntries(directory) { try { return (await readdir(directory)).length > 0; } catch { return false; } }
async function directoryEntries(directory) { try { return (await readdir(directory)).sort(); } catch { return []; } }

async function initializeGit(root) {
  try { await promisify(execFile)("git", ["init"], { cwd: root, windowsHide: true }); }
  catch (error) { throw new Error(`Unable to initialize Git for the new project: ${error.message}`); }
}
async function backupFile(source, target) { if (!(await fileExists(source))) return null; await cp(source, target); return target; }
async function getManagedManifest(root) {
  try { return JSON.parse(await readFile(path.join(root, ROOT, MANIFEST), "utf8")); }
  catch { return { schemaVersion: 1, operations: [] }; }
}
async function writeManagedManifest(root, manifest) {
  await mkdir(path.join(root, ROOT), { recursive: true });
  await writeFile(path.join(root, ROOT, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
async function recordManagedOperation(root, operation) {
  const manifest = await getManagedManifest(root);
  manifest.operations.push({ ...operation, at: new Date().toISOString() });
  manifest.updatedAt = new Date().toISOString();
  await writeManagedManifest(root, manifest);
}
function hashContents(contents) { return createHash("sha256").update(contents).digest("hex"); }
function normalizeRegistry(registry) {
  return {
    initialized: true,
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    modules: [],
    integrations: {},
    toolVersions: {},
    providers: [],
    providerProfiles: [],
    ...registry,
  };
}
