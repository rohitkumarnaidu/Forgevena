import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const REQUIRED_PACKAGE_FILES = ["bin/ai-workspace.js", "src/cli.js", "README.md", "CHANGELOG.md", "CONTRIBUTING.md", "VERSION", "completions/", "examples/", "man/", "package.json"];
const FORBIDDEN_PATTERNS = [
  /^\.env(?:\.|$)/,
  /^\.ai-workspace\/local-secrets\//,
  /^(?:backups|cache|logs|registry|updates)\//,
  /node_modules\//,
];

export async function verifyReleasePackage(root, { packageFiles } = {}) {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const files = packageFiles ?? packageJson.files ?? [];
  const issues = [];
  if (packageJson.private === true) issues.push("package.json must not be private for npm distribution.");
  if (!packageJson.bin?.["ai-workspace"]) issues.push("The ai-workspace executable is not declared.");
  if (!packageJson.engines?.node) issues.push("A Node.js compatibility range is required.");
  if (!Array.isArray(files) || files.length === 0) issues.push("Explicit package files are required.");
  for (const required of REQUIRED_PACKAGE_FILES) if (!isIncluded(files, required)) issues.push(`${required} is not included in the package allowlist.`);
  for (const entry of files) if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(normalize(entry)))) issues.push(`Forbidden package path: ${entry}.`);
  return {
    valid: issues.length === 0,
    issues,
    package: packageJson.name,
    version: packageJson.version,
    node: packageJson.engines?.node ?? null,
    operatingSystems: packageJson.os ?? ["darwin", "linux", "win32"],
    architectures: packageJson.cpu ?? ["x64", "arm64"],
    files,
  };
}

export function releaseChecksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function isIncluded(files, required) {
  return files.some((entry) => required === normalize(entry) || required.startsWith(`${normalize(entry).replace(/\/$/, "")}/`));
}
function normalize(value) { return String(value).replaceAll("\\", "/").replace(/^\.\//, ""); }
