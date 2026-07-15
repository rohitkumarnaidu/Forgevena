import { access, readFile } from "node:fs/promises";
import path from "node:path";

const baselineRequired = [
  "docs", "docs/architecture", "docs/adr", "docs/api", "docs/database", "docs/security", "docs/testing", "docs/deployment", "docs/operations", "docs/runbooks", "docs/decisions",
  ".ai", "configs", "templates", ".ai-workspace/workspace.json",
];
const newProjectRequired = [
  "README.md", ".gitignore", ".gitattributes", ".editorconfig", ".env.example", "SECURITY.md", "DESIGN.md",
  "tests", ".github", ".github/workflows/ci.yml", ".github/pull_request_template.md", "docker", "docker-compose.yml", "Dockerfile", "monitoring", "security", "security/dependency-policy.md", "scripts", "prompts", "assets", "examples",
];
const stackRequired = {
  react: ["package.json", "index.html", "src/main.jsx"],
  nextjs: ["package.json", "next.config.mjs", "app/layout.js", "app/page.js"],
  fastapi: ["pyproject.toml", "src/app/main.py", "tests/unit/test_health.py"],
  express: ["package.json", "src/server.js"],
  python: ["pyproject.toml", "src/app/main.py", "tests/unit/test_main.py"],
};

export async function validateBootstrap(root, options = {}) {
  const registry = await readRegistry(root);
  const mode = options.mode ?? registry.bootstrapMode ?? "new-project";
  const template = options.template ?? registry.template ?? "enterprise";
  const required = [...baselineRequired, ...(mode === "new-project" ? newProjectRequired : []), ...(mode === "new-project" ? stackRequired[template] ?? [] : [])];
  const checks = await Promise.all(required.map(async (item) => [item, await exists(path.join(root, item))]));
  const missing = checks.filter(([, present]) => !present).map(([item]) => item);
  return { root, valid: missing.length === 0, mode, template, required: Object.fromEntries(checks), missing };
}

async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function readRegistry(root) {
  try { return JSON.parse(await readFile(path.join(root, ".ai-workspace", "workspace.json"), "utf8")); }
  catch { return {}; }
}
