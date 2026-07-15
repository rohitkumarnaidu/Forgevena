import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const tools = [
  ["node", ["--version"]], ["npm", ["--version"]], ["pnpm", ["--version"]], ["bun", ["--version"]], ["uv", ["--version"]],
  ["git", ["--version"]], ["python", ["--version"]], ["docker", ["--version"]], ["code", ["--version"]], ["claude", ["--version"]],
  ["cursor", ["--version"]], ["codex", ["--version"]], ["gh", ["--version"]], ["openspec", ["--version"]]
];

export async function inspectEnvironment(root) {
  const detected = await Promise.all(tools.map(async ([name, args]) => ({ name, ...(await commandStatus(name, args)) })));
  const signals = await detectProject(root);
  return { root, operatingSystem: await detectOperatingSystem(), tools: detected, project: signals, recommendations: recommendations(detected, signals) };
}

export async function detectProject(root) {
  const signalNames = ["package.json", "pyproject.toml", "requirements.txt", "Dockerfile", "docker-compose.yml", ".git", "openspec", "DESIGN.md", "pubspec.yaml", "manage.py", "angular.json", "vue.config.js", "pom.xml", "build.gradle", "Cargo.toml", "go.mod"];
  const flags = Object.fromEntries(await Promise.all(signalNames.map(async (name) => [name, await exists(path.join(root, name))])));
  const packageJson = flags["package.json"] ? await readJson(path.join(root, "package.json")) : {};
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  const frameworks = [];
  if (dependencies.next) frameworks.push("Next.js");
  else if (dependencies.react) frameworks.push("React");
  if (dependencies.express) frameworks.push("Express");
  if (flags["pyproject.toml"] || flags["requirements.txt"]) frameworks.push("Python");
  if (flags["manage.py"]) frameworks.push("Django");
  if (flags["pubspec.yaml"]) frameworks.push("Flutter");
  if (flags["angular.json"]) frameworks.push("Angular");
  if (flags["vue.config.js"] || dependencies.vue) frameworks.push("Vue");
  if (flags["pom.xml"] || flags["build.gradle"]) frameworks.push("Spring");
  if (flags["Cargo.toml"]) frameworks.push("Rust");
  if (flags["go.mod"]) frameworks.push("Go");
  if (await containsAny(path.join(root, "requirements.txt"), ["fastapi"]) || await containsAny(path.join(root, "pyproject.toml"), ["fastapi"])) frameworks.push("FastAPI");
  return { flags, frameworks, packageManager: flags["package.json"] ? "npm-compatible" : null };
}

async function detectOperatingSystem() {
  const isWsl = Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
  let linuxDistribution = null;
  if (process.platform === "linux") {
    try { linuxDistribution = (await readFile("/etc/os-release", "utf8")).match(/^PRETTY_NAME="?(.+?)"?$/m)?.[1] ?? "Linux"; } catch { linuxDistribution = "Linux"; }
  }
  return { platform: process.platform, windows: process.platform === "win32", wsl: isWsl, ubuntu: Boolean(linuxDistribution?.toLowerCase().includes("ubuntu")), linuxDistribution };
}

async function commandStatus(name, args) {
  try { const { stdout, stderr } = await exec(name, args, { windowsHide: true }); return { installed: true, version: (stdout || stderr).trim().split("\n")[0] }; }
  catch { return { installed: false }; }
}
async function exists(filePath) { try { await access(filePath, constants.F_OK); return true; } catch { return false; } }
async function readJson(filePath) { try { return JSON.parse(await readFile(filePath, "utf8")); } catch { return {}; } }
async function containsAny(filePath, values) { try { const text = await readFile(filePath, "utf8"); return values.some((value) => text.toLowerCase().includes(value)); } catch { return false; } }
function recommendations(detected, project) {
  const missing = detected.filter((tool) => !tool.installed).map((tool) => tool.name);
  return [missing.length ? `Missing developer tools: ${missing.join(", ")}.` : "Core detected tools are installed.", project.frameworks.length ? `Detected project stack: ${project.frameworks.join(", ")}.` : "No application framework detected.", "Record missing prerequisites and install them through approved organization workflows; third-party integrations are deferred beyond Phase 2."];
}
