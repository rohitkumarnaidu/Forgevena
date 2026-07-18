import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_ROOT = path.join("dist", "supply-chain");
const SECRET_PATTERNS = [
  { name: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "bearer-token", pattern: /\bBearer\s+[A-Za-z0-9._~+\/-]{16,}/i },
  { name: "api-key", pattern: /\b(?:sk|key)-[A-Za-z0-9_-]{20,}\b/ },
];

export async function generateSupplyChainArtifacts(root, { dryRun = true, output = OUTPUT_ROOT } = {}) {
  const outputRoot = path.resolve(root, output);
  const files = ["sbom.cdx.json", "provenance.intoto.jsonl", "SHA256SUMS"];
  const existing = [], create = [];
  for (const file of files) ((await exists(path.join(outputRoot, file))) ? existing : create).push(file);
  const plan = { dryRun, output: path.relative(root, outputRoot), create, skipped: existing, overwrite: false };
  if (dryRun) return plan;
  const [packageJson, packageLock, subjects] = await Promise.all([readJson(path.join(root, "package.json")), readJson(path.join(root, "package-lock.json")), releaseSubjects(root)]);
  const artifacts = {
    "sbom.cdx.json": `${JSON.stringify(cycloneDx(packageJson, packageLock), null, 2)}\n`,
    "provenance.intoto.jsonl": `${JSON.stringify(provenance(packageJson, subjects))}\n`,
    SHA256SUMS: subjects.map(({ path: file, sha256 }) => `${sha256}  ${file}`).join("\n") + "\n",
  };
  await mkdir(outputRoot, { recursive: true });
  for (const file of create) await writeFile(path.join(outputRoot, file), artifacts[file], { encoding: "utf8", flag: "wx" });
  return { ...plan, dryRun: false, created: create, subjects: subjects.length };
}

export async function verifySupplyChainReadiness(root) {
  const required = ["package-lock.json", ".github/workflows/security.yml", ".github/workflows/release.yml", "SECURITY.md", "docs/security/THREAT_MODEL.md"];
  const missing = [];
  for (const file of required) if (!(await exists(path.join(root, file)))) missing.push(file);
  const issues = missing.map((file) => `Missing supply-chain control: ${file}.`);
  const packageLock = await readJson(path.join(root, "package-lock.json")).catch(() => null);
  if (packageLock?.lockfileVersion < 3) issues.push("package-lock.json must use lockfileVersion 3 or newer.");
  const publish = await readText(path.join(root, ".github/workflows/release.yml"));
  const security = await readText(path.join(root, ".github/workflows/security.yml"));
  if (!publish.includes("--provenance")) issues.push("Package publication must enable npm provenance.");
  if (!publish.includes("id-token: write")) issues.push("Publication workflow requires least-scope OIDC permission for provenance.");
  if (!security.includes("npm audit")) issues.push("Security workflow must run dependency audit.");
  if (!security.includes("codeql-action/analyze")) issues.push("Security workflow must run CodeQL analysis.");
  const secretScan = await scanRepositorySecrets(root);
  issues.push(...secretScan.findings.map((finding) => `Potential ${finding.type} in ${finding.path}:${finding.line}.`));
  return { valid: issues.length === 0, issues, controls: { lockfile: Boolean(packageLock), provenance: publish.includes("--provenance"), oidc: publish.includes("id-token: write"), dependencyAudit: security.includes("npm audit"), codeql: security.includes("codeql-action/analyze"), secretScan }, generatedArtifactsRequiredForPublication: ["sbom.cdx.json", "provenance.intoto.jsonl", "SHA256SUMS"] };
}

export async function verifySupplyChainArtifacts(root, { output = OUTPUT_ROOT } = {}) {
  const outputRoot = path.resolve(root, output);
  try {
    const sbom = await readJson(path.join(outputRoot, "sbom.cdx.json"));
    const statement = JSON.parse((await readFile(path.join(outputRoot, "provenance.intoto.jsonl"), "utf8")).trim());
    const sums = await readFile(path.join(outputRoot, "SHA256SUMS"), "utf8");
    const issues = [];
    if (sbom.bomFormat !== "CycloneDX" || sbom.specVersion !== "1.5") issues.push("SBOM is not CycloneDX 1.5.");
    if (statement._type !== "https://in-toto.io/Statement/v1") issues.push("Provenance is not an in-toto Statement v1.");
    for (const subject of statement.subject ?? []) if (!sums.includes(`${subject.digest.sha256}  ${subject.name}`)) issues.push(`Checksum is missing for ${subject.name}.`);
    return { valid: issues.length === 0, issues, subjects: statement.subject?.length ?? 0, sbomComponents: sbom.components?.length ?? 0 };
  } catch (error) { return { valid: false, issues: [error.message], subjects: 0, sbomComponents: 0 }; }
}

export async function scanRepositorySecrets(root) {
  const findings = [];
  const files = await sourceFiles(root);
  for (const file of files) {
    const contents = await readFile(path.join(root, file), "utf8").catch(() => "");
    contents.split(/\r?\n/).forEach((line, index) => { for (const candidate of SECRET_PATTERNS) if (candidate.pattern.test(line)) findings.push({ path: file, line: index + 1, type: candidate.name }); });
  }
  return { valid: findings.length === 0, findings, scannedFiles: files.length };
}

function cycloneDx(packageJson, lock) {
  const components = Object.entries(lock.packages ?? {}).filter(([location]) => location.startsWith("node_modules/")).map(([location, value]) => ({ type: "library", name: value.name ?? location.split("node_modules/").at(-1), version: value.version ?? "unknown", purl: value.version ? `pkg:npm/${encodeURIComponent(value.name ?? location.split("node_modules/").at(-1))}@${value.version}` : undefined, hashes: value.integrity ? [{ alg: "SHA-512", content: value.integrity.replace(/^sha512-/, "") }] : undefined })).sort((left, right) => `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`));
  return { bomFormat: "CycloneDX", specVersion: "1.5", serialNumber: `urn:uuid:${stableUuid(`${packageJson.name}@${packageJson.version}`)}`, version: 1, metadata: { component: { type: "application", name: packageJson.name, version: packageJson.version }, tools: { components: [{ type: "application", name: "forgevena", version: packageJson.version }] } }, components };
}
function provenance(packageJson, subjects) { return { _type: "https://in-toto.io/Statement/v1", subject: subjects.map(({ path: name, sha256 }) => ({ name, digest: { sha256 } })), predicateType: "https://slsa.dev/provenance/v1", predicate: { buildDefinition: { buildType: "https://forgevena.dev/build/npm-package/v1", externalParameters: { package: packageJson.name, version: packageJson.version }, internalParameters: {}, resolvedDependencies: [] }, runDetails: { builder: { id: "https://github.com/rohitkumarnaidu/Forgevena/.github/workflows/release.yml" }, metadata: { invocationId: `forgevena-${packageJson.version}`, startedOn: null, finishedOn: null } } } }; }
async function releaseSubjects(root) { const candidates = ["package.json", "package-lock.json", "VERSION", "bin/forgevena.js", "bin/ai-workspace.js"]; return Promise.all(candidates.map(async (file) => ({ path: file, sha256: createHash("sha256").update(await readFile(path.join(root, file))).digest("hex") }))); }
async function sourceFiles(root) { const result = []; const excluded = new Set([".git", "node_modules", "dist", ".ai-workspace", "cache", "backups", "logs", "registry", "updates", "site"]); async function walk(relative = "") { let entries; try { entries = await readdir(path.join(root, relative), { withFileTypes: true }); } catch (error) { if (["EACCES", "EPERM"].includes(error?.code)) return; throw error; } for (const entry of entries) { const next = path.join(relative, entry.name); if (entry.isDirectory()) { if (!excluded.has(entry.name)) await walk(next); } else if (/\.(?:js|json|md|ya?ml|ps1|sh|txt)$/i.test(entry.name) && !/package-lock\.json$/i.test(entry.name)) result.push(next.replaceAll("\\", "/")); } } await walk(); return result.sort(); }
function stableUuid(input) { const hex = createHash("sha256").update(input).digest("hex").slice(0, 32).split(""); hex[12] = "5"; hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16); return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`; }
async function readJson(target) { return JSON.parse(await readFile(target, "utf8")); }
async function readText(target) { return readFile(target, "utf8").catch(() => ""); }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
