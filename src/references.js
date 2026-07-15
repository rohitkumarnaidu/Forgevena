import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const references = {
  "design-md": "https://github.com/google-labs-code/design.md.git",
  astryx: "https://github.com/facebook/astryx.git",
  "anthropic-skills": "https://github.com/anthropics/skills.git",
  "nvidia-skills": "https://github.com/NVIDIA/skills.git"
};

export function listReferences() { return Object.entries(references).map(([name, url]) => ({ name, url })); }
export async function addReference(name, { dryRun = true } = {}) {
  const url = references[name];
  if (!url) throw new Error(`Choose one of: ${Object.keys(references).join(", ")}.`);
  const root = path.resolve(process.cwd(), "reference");
  const target = path.join(root, name);
  const alreadyPresent = await exists(target);
  const result = { name, url, target, dryRun, alreadyPresent, command: `git clone --depth 1 ${url} ${target}`, scope: "workspace reference directory", dataImpact: "Downloads the public repository history and working tree.", affectedPaths: [target], rollback: "Delete only the cloned reference directory after confirming it contains no local work." };
  if (dryRun || alreadyPresent) return result;
  await mkdir(root, { recursive: true });
  await exec("git", ["clone", "--depth", "1", url, target], { windowsHide: true });
  return { ...result, dryRun: false, cloned: true };
}
async function exists(target) { try { await access(target, constants.F_OK); return true; } catch { return false; } }
