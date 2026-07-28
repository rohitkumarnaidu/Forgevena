import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const VISUAL_EVIDENCE_SCHEMA_VERSION = 1;
export const EXECUTABLE_EXAMPLE_SCHEMA_VERSION = 1;

const VISUAL_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const SAFE_EXAMPLES = new Set([
  "./bin/forgevena.js\u0000version",
  "./bin/forgevena.js\u0000help",
  "./bin/forgevena.js\u0000templates",
]);

export async function validateDocumentationAssets(root, { executeExamples = true, now = new Date() } = {}) {
  const visual = await validateVisualEvidence(root, now);
  const examples = await validateExecutableExamples(root, { execute: executeExamples, now });
  return { valid: visual.valid && examples.valid, visual, examples, issues: [...visual.issues, ...examples.issues] };
}

export async function validateVisualEvidence(root, now = new Date()) {
  const issues = [];
  const manifestPath = path.join(root, "docs", "assets", "visual-evidence.json");
  const manifest = await readJson(manifestPath, issues, "Visual evidence manifest");
  if (!manifest) return result(issues);
  if (manifest.schemaVersion !== VISUAL_EVIDENCE_SCHEMA_VERSION || !Array.isArray(manifest.assets)) issues.push("Visual evidence must use schemaVersion 1 and define assets.");
  const declared = new Set();
  for (const asset of manifest.assets ?? []) {
    const label = asset?.path ?? "<unknown>";
    for (const field of ["path", "type", "altText", "productVersion", "reviewedAt", "reviewBy", "sha256"]) if (!asset?.[field]) issues.push(`Visual evidence ${label} is missing ${field}.`);
    if (!Array.isArray(asset?.sourceDependencies) || asset.sourceDependencies.length === 0) issues.push(`Visual evidence ${label} requires sourceDependencies.`);
    if (declared.has(asset.path)) issues.push(`Visual evidence duplicates ${asset.path}.`);
    declared.add(asset.path);
    if (!isSafeRepositoryPath(asset.path) || !asset.path.startsWith("docs/assets/")) { issues.push(`Visual evidence path is unsafe: ${label}.`); continue; }
    const target = path.join(root, asset.path);
    try {
      const contents = path.extname(target).toLowerCase() === ".svg"
        ? normalizeText(await readFile(target, "utf8"))
        : await readFile(target);
      if (digest(contents) !== asset.sha256) issues.push(`Visual evidence ${label} has a stale content hash.`);
    } catch { issues.push(`Visual evidence asset is missing: ${label}.`); }
    const reviewBy = new Date(asset.reviewBy);
    if (Number.isNaN(reviewBy.valueOf()) || reviewBy < now) issues.push(`Visual evidence ${label} has an invalid or expired reviewBy date.`);
    for (const dependency of asset.sourceDependencies ?? []) {
      if (!isSafeRepositoryPath(dependency?.path) || !dependency?.sha256) { issues.push(`Visual evidence ${label} has an invalid source dependency.`); continue; }
      try {
        const contents = await readFile(path.join(root, dependency.path), "utf8");
        if (digest(normalizeText(contents)) !== dependency.sha256) issues.push(`Visual evidence ${label} source dependency ${dependency.path} changed without review.`);
      } catch { issues.push(`Visual evidence ${label} source dependency is missing: ${dependency.path}.`); }
    }
  }
  const actual = await findVisualAssets(path.join(root, "docs", "assets"), root);
  for (const asset of actual) if (!declared.has(asset)) issues.push(`Visual asset ${asset} is orphaned from visual-evidence.json.`);
  for (const asset of declared) if (!actual.includes(asset)) issues.push(`Visual evidence declares non-visual or missing asset ${asset}.`);
  return result(issues, { assetsChecked: actual.length });
}

export async function validateExecutableExamples(root, { execute = true, now = new Date() } = {}) {
  const issues = [];
  const manifest = await readJson(path.join(root, "docs", "examples", "executable-evidence.json"), issues, "Executable example manifest");
  if (!manifest) return result(issues);
  if (manifest.schemaVersion !== EXECUTABLE_EXAMPLE_SCHEMA_VERSION || !Array.isArray(manifest.examples)) issues.push("Executable examples must use schemaVersion 1 and define examples.");
  const ids = new Set();
  let executed = 0;
  for (const example of manifest.examples ?? []) {
    const label = example?.id ?? "<unknown>";
    for (const field of ["id", "description", "executable", "expectedOutputSha256", "verifiedAt", "reviewBy"]) if (!example?.[field]) issues.push(`Executable example ${label} is missing ${field}.`);
    if (!Array.isArray(example?.args) || example.args.length === 0) issues.push(`Executable example ${label} requires args.`);
    if (!Array.isArray(example?.platforms) || example.platforms.length === 0) issues.push(`Executable example ${label} requires platforms.`);
    if (ids.has(example.id)) issues.push(`Executable example duplicates ${example.id}.`);
    ids.add(example.id);
    const signature = (example.args ?? []).join("\u0000");
    if (example.executable !== "node" || !SAFE_EXAMPLES.has(signature)) issues.push(`Executable example ${label} is not allowlisted and local-only.`);
    if (!Number.isInteger(example.timeoutMs) || example.timeoutMs < 100 || example.timeoutMs > 10_000) issues.push(`Executable example ${label} has an invalid timeoutMs.`);
    const reviewBy = new Date(example.reviewBy);
    if (Number.isNaN(reviewBy.valueOf()) || reviewBy < now) issues.push(`Executable example ${label} has an invalid or expired reviewBy date.`);
    if (execute && example.platforms?.includes(process.platform) && example.executable === "node" && SAFE_EXAMPLES.has(signature)) {
      try {
        const run = await runSafeExample(root, example);
        executed += 1;
        if (run.code !== (example.expectedExitCode ?? 0)) issues.push(`Executable example ${label} exited with ${run.code}.`);
        if (digest(normalizeOutput(run.stdout)) !== example.expectedOutputSha256) issues.push(`Executable example ${label} output evidence is stale.`);
        for (const expected of example.outputContains ?? []) if (!run.stdout.includes(expected)) issues.push(`Executable example ${label} output is missing ${expected}.`);
      } catch (error) { issues.push(`Executable example ${label} failed: ${error.message}`); }
    }
  }
  return result(issues, { examplesChecked: manifest.examples?.length ?? 0, examplesExecuted: executed });
}

export function runSafeExample(root, example) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, example.args, { cwd: root, env: { ...process.env, CI: "true", FORGEVENA_EXAMPLE_VALIDATION: "true" }, shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, example.timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`timed out after ${example.timeoutMs} ms`));
      else resolve({ code, stdout, stderr });
    });
  });
}

function normalizeOutput(value) { return `${value.replace(/\r\n/g, "\n").trimEnd()}\n`; }
function normalizeText(value) { return value.replace(/\r\n/g, "\n"); }
function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function isSafeRepositoryPath(value) { return typeof value === "string" && !path.isAbsolute(value) && !value.split(/[\\/]/).includes(".."); }
async function readJson(file, issues, label) { try { return JSON.parse(await readFile(file, "utf8")); } catch { issues.push(`${label} is missing or invalid JSON.`); return null; } }
async function findVisualAssets(directory, root) {
  try { await access(directory); } catch { return []; }
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await findVisualAssets(target, root));
    else if (entry.isFile() && VISUAL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) found.push(path.relative(root, target).replaceAll("\\", "/"));
  }
  return found.sort();
}
function result(issues, details = {}) { return { valid: issues.length === 0, issues, ...details }; }
