import { moduleFiles } from "./templates.js";
import { access } from "node:fs/promises";
import path from "node:path";

const names = ["core", "doctor", "bootstrap", "registry", "logging", "config", "templates", "providers", "project", "docs", "design", "testing", "docker", "monitoring", "github", "ai"];

export function supportedModules() { return names; }
export function moduleContract(name) {
  if (!names.includes(name)) throw new Error(`Unsupported module: ${name}`);
  const files = () => moduleFiles(name);
  return {
    name,
    initialize: files,
    install: files,
    update: files,
    validate: async (root) => {
      const required = files().map((entry) => entry.relative);
      const present = await Promise.all(required.map(async (relative) => [relative, await exists(path.join(root, relative))]));
      const missing = present.filter(([, available]) => !available).map(([relative]) => relative);
      return { name, valid: missing.length === 0, missing };
    },
    status: async (root) => {
      if (!root) return { name, initialized: false, required: files().map((entry) => entry.relative) };
      const present = await Promise.all(files().map(async (entry) => [entry.relative, await exists(path.join(root, entry.relative))]));
      const missing = present.filter(([, available]) => !available).map(([relative]) => relative);
      return { name, initialized: missing.length === 0, files: Object.fromEntries(present), missing };
    },
    remove: () => ({ name, supported: false, reason: "Module removal never deletes project files." }),
    rollback: () => ({ name, supported: true, scope: "Managed project rollback is handled by the bootstrap transaction manifest." }),
  };
}

async function exists(target) { try { await access(target); return true; } catch { return false; } }
