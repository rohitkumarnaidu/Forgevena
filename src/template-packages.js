import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { templateAssets, validateTemplate } from "./template-catalog.js";

export const TEMPLATE_PACKAGE_SCHEMA_VERSION = 1;

export class TemplatePackageError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "TemplatePackageError"; this.code = code; this.details = details; }
}

export async function loadTemplatePackage(manifestPath, { ancestry = [] } = {}) {
  const absoluteManifest = path.resolve(manifestPath);
  const directory = path.dirname(absoluteManifest);
  const manifest = validateTemplateManifest(JSON.parse(await readFile(absoluteManifest, "utf8")), directory);
  if (ancestry.includes(manifest.id)) throw new TemplatePackageError("TEMPLATE_INHERITANCE_CYCLE", `Template inheritance cycle detected at ${manifest.id}.`);
  const parent = manifest.extends ? await loadTemplatePackage(path.resolve(directory, manifest.extends), { ancestry: [...ancestry, manifest.id] }) : null;
  const inheritedAssets = parent?.assets ?? [];
  const localAssets = await Promise.all(manifest.assets.map(async (asset) => {
    const source = contained(directory, asset.source);
    const contents = await readFile(source);
    const digest = `sha256-${createHash("sha256").update(contents).digest("base64")}`;
    if (asset.integrity && asset.integrity !== digest) throw new TemplatePackageError("TEMPLATE_INTEGRITY_MISMATCH", `Integrity validation failed for ${asset.source}.`, { expected: asset.integrity, actual: digest });
    return { path: normalizeTarget(asset.target), source: path.relative(directory, source), contents: contents.toString("utf8"), integrity: digest };
  }));
  const merged = new Map(inheritedAssets.map((asset) => [asset.path, asset]));
  for (const asset of localAssets) merged.set(asset.path, asset);
  return { manifest, assets: [...merged.values()].sort((left, right) => left.path.localeCompare(right.path)), inheritedFrom: parent ? [parent.manifest.id, ...(parent.inheritedFrom ?? [])] : [] };
}

export async function verifyTemplatePackage(manifestPath) {
  try {
    const template = await loadTemplatePackage(manifestPath);
    return { valid: true, id: template.manifest.id, version: template.manifest.version, assets: template.assets.map(({ path: target, integrity }) => ({ path: target, integrity })), inheritedFrom: template.inheritedFrom, dependencyLockRequired: template.manifest.dependencyLockRequired };
  } catch (error) {
    return { valid: false, error: { code: error.code ?? "TEMPLATE_PACKAGE_INVALID", message: error.message, details: error.details ?? {} } };
  }
}

export async function exportBuiltInTemplatePackage(outputRoot, name, { dryRun = true } = {}) {
  const template = validateTemplate(name);
  const packageRoot = path.resolve(outputRoot, template);
  const assets = templateAssets(template).map((asset) => {
    const source = path.posix.join("assets", asset.path.replaceAll("\\", "/"));
    const integrity = `sha256-${createHash("sha256").update(asset.contents).digest("base64")}`;
    return { source, target: asset.path.replaceAll("\\", "/"), integrity, contents: asset.contents };
  });
  const manifest = { schemaVersion: 1, id: template, version: "1.0.0", description: `Forgevena built-in ${template} project template.`, compatibility: { forgevena: ">=1.1.0" }, dependencyLockRequired: true, assets: assets.map(({ source, target, integrity }) => ({ source, target, integrity })) };
  const files = [{ path: "template.json", contents: `${JSON.stringify(manifest, null, 2)}\n` }, ...assets.map((asset) => ({ path: asset.source, contents: asset.contents }))];
  const create = [], skipped = [];
  for (const file of files) ((await exists(path.join(packageRoot, file.path))) ? skipped : create).push(file);
  const plan = { template, packageRoot, dryRun, create: create.map((file) => file.path), skipped: skipped.map((file) => file.path), overwrite: false };
  if (dryRun) return plan;
  for (const file of create) { const target = path.join(packageRoot, file.path); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, file.contents, { encoding: "utf8", flag: "wx" }); }
  return { ...plan, dryRun: false, created: create.map((file) => file.path), manifest: path.join(packageRoot, "template.json") };
}

export function validateTemplateManifest(value, directory = ".") {
  if (value?.schemaVersion !== TEMPLATE_PACKAGE_SCHEMA_VERSION) throw new TemplatePackageError("TEMPLATE_SCHEMA_INVALID", "Template package schemaVersion must be 1.");
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value.id ?? "")) throw new TemplatePackageError("TEMPLATE_ID_INVALID", "Template id must use 1-64 safe characters.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version ?? "")) throw new TemplatePackageError("TEMPLATE_VERSION_INVALID", "Template version must use semantic versioning.");
  if (!Array.isArray(value.assets) || value.assets.length === 0) throw new TemplatePackageError("TEMPLATE_ASSETS_INVALID", "Template packages require at least one asset.");
  const assets = value.assets.map((asset) => { if (!asset?.source || !asset?.target) throw new TemplatePackageError("TEMPLATE_ASSET_INVALID", "Template assets require source and target."); contained(directory, asset.source); return { source: String(asset.source), target: normalizeTarget(asset.target), integrity: asset.integrity ? String(asset.integrity) : null }; });
  const targets = assets.map(({ target }) => target);
  if (new Set(targets).size !== targets.length) throw new TemplatePackageError("TEMPLATE_TARGET_DUPLICATE", "Template asset targets must be unique.");
  return { schemaVersion: 1, id: value.id, version: value.version, description: String(value.description ?? ""), extends: value.extends ? String(value.extends) : null, compatibility: value.compatibility ?? { forgevena: ">=1.1.0" }, dependencyLockRequired: value.dependencyLockRequired !== false, assets };
}

function contained(directory, relative) { const root = path.resolve(directory); const target = path.resolve(root, relative); if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new TemplatePackageError("TEMPLATE_PATH_ESCAPE", "Template sources must remain inside the package directory.", { relative }); return target; }
function normalizeTarget(target) { const normalized = String(target).replaceAll("\\", "/").replace(/^\.\//, ""); if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) throw new TemplatePackageError("TEMPLATE_TARGET_INVALID", "Template targets must be safe project-relative paths.", { target }); return normalized; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
