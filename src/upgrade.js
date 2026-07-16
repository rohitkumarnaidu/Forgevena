import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PLATFORM_VERSION, REGISTRY_SCHEMA_VERSION } from "./version.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const WORKSPACE = ".ai-workspace";
const REGISTRY = "workspace.json";
const STATE = "upgrade-state.json";

export async function upgradeWorkspace(root, { dryRun = true } = {}) {
  const registryPath = path.join(root, WORKSPACE, REGISTRY);
  const registry = await readStateDocument(root, path.join(WORKSPACE, REGISTRY), null);
  if (!registry) throw new Error("Initialize the project before upgrading it.");
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
  await writeStateDocument(root, path.join(WORKSPACE, REGISTRY), migrated);
  await writeStateDocument(root, path.join(WORKSPACE, STATE), { schemaVersion: 1, id, backup: path.relative(root, backup), from, to: plan.to, appliedAt: new Date().toISOString(), status: "applied" });
  return { ...plan, applied: true, backup: path.relative(root, backup), id };
}

export async function rollbackUpgrade(root, { dryRun = true, yes = false } = {}) {
  const state = await readStateDocument(root, path.join(WORKSPACE, STATE), null);
  if (!state) throw new Error("No upgrade state is available for rollback.");
  const plan = { dryRun, id: state.id, restore: state.backup, from: state.to, to: state.from };
  if (dryRun) return { ...plan, applied: false, confirmation: "Re-run with --apply --yes to restore the pre-upgrade registry backup." };
  if (!yes) throw new Error("Upgrade rollback requires --apply --yes.");
  await writeStateDocument(root, path.join(WORKSPACE, REGISTRY), JSON.parse(await readFile(path.join(root, state.backup), "utf8")));
  await writeStateDocument(root, path.join(WORKSPACE, STATE), { ...state, status: "rolled-back", rolledBackAt: new Date().toISOString() });
  return { ...plan, applied: true };
}
