import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { PLATFORM_VERSION, REGISTRY_SCHEMA_VERSION } from "./version.js";

const WORKSPACE = ".ai-workspace";
const REGISTRY = "workspace.json";
const STATE = "upgrade-state.json";

export async function upgradeWorkspace(root, { dryRun = true } = {}) {
  const registryPath = path.join(root, WORKSPACE, REGISTRY);
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const from = { version: registry.workspaceVersion ?? "0.1.0", schemaVersion: registry.schemaVersion ?? 1 };
  const changes = [];
  if (from.schemaVersion < 2) changes.push("Migrate registry to schema version 2 with integration, provider, and tool-version collections.");
  if (from.version !== PLATFORM_VERSION) changes.push(`Update workspace version from ${from.version} to ${PLATFORM_VERSION}.`);
  const plan = { dryRun, from, to: { version: PLATFORM_VERSION, schemaVersion: REGISTRY_SCHEMA_VERSION }, changes, compatible: from.schemaVersion <= REGISTRY_SCHEMA_VERSION };
  if (!plan.compatible) throw new Error(`Registry schema ${from.schemaVersion} is newer than supported schema ${REGISTRY_SCHEMA_VERSION}. Upgrade the CLI first.`);
  if (dryRun || changes.length === 0) return { ...plan, applied: false };
  const backupDirectory = path.join(root, WORKSPACE, "backups");
  await mkdir(backupDirectory, { recursive: true });
  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(backupDirectory, `upgrade-${id}.json`);
  await copyFile(registryPath, backup);
  const migrated = { initialized: true, modules: [], integrations: {}, toolVersions: {}, providers: [], providerProfiles: [], ...registry, schemaVersion: REGISTRY_SCHEMA_VERSION, workspaceVersion: PLATFORM_VERSION, updatedAt: new Date().toISOString() };
  await atomicJson(registryPath, migrated);
  await atomicJson(path.join(root, WORKSPACE, STATE), { schemaVersion: 1, id, backup: path.relative(root, backup), from, to: plan.to, appliedAt: new Date().toISOString() });
  return { ...plan, applied: true, backup: path.relative(root, backup), id };
}

export async function rollbackUpgrade(root, { dryRun = true, yes = false } = {}) {
  const statePath = path.join(root, WORKSPACE, STATE);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const plan = { dryRun, id: state.id, restore: state.backup, from: state.to, to: state.from };
  if (dryRun) return { ...plan, applied: false, confirmation: "Re-run with --apply --yes to restore the pre-upgrade registry backup." };
  if (!yes) throw new Error("Upgrade rollback requires --apply --yes.");
  await copyFile(path.join(root, state.backup), path.join(root, WORKSPACE, REGISTRY));
  await rename(statePath, `${statePath}.${state.id}.rolled-back`);
  return { ...plan, applied: true };
}

async function atomicJson(target, value) {
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporary, target);
}
