import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { supportedModules } from "./modules.js";
import { listProviderProfiles } from "./providers.js";
import { listTemplates } from "./template-catalog.js";

const OUTPUT_ROOT = path.join("docs", "reference", "generated");
const COMMANDS = [
  ["doctor", "Inspect environment and ecosystem health."], ["status", "Inspect project registry state."], ["validate", "Validate managed bootstrap assets."], ["state", "Validate, repair, snapshot, migrate, or inspect state history."], ["vault", "Initialize, rotate, recover, or audit encrypted credentials."], ["init", "Initialize an existing project additively."], ["create", "Create a new project from a supported template."], ["add", "Add module or integration assets."], ["update", "Add newly managed missing assets."], ["rollback", "Remove unchanged assets owned by a managed operation."], ["integrations", "Manage integration lifecycle."], ["providers", "Configure and invoke provider adapters."], ["mcp", "Manage MCP definitions and activation."], ["plugins", "Manage signed declarative and isolated runtime plugins."], ["templates", "Manage built-ins, packages, and signed catalogs."], ["org", "Manage signed local organization policy."], ["diagnostics", "Inspect local metrics, traces, health, profiles, and bundles."], ["supply-chain", "Verify or generate SBOM, provenance, and checksums."], ["skills", "Manage signed, policy-approved prompts and engineering skills."], ["workflows", "Validate and run deterministic resumable DAG workflows."], ["index", "Build and query a local metadata-only project index."], ["semantic", "Build and query an optional provider-backed embedding index."], ["copilot", "Produce read-only provider-backed engineering plans from approved metadata."], ["cloud", "Prepare and validate consent-gated cloud plans."], ["docker", "Plan, validate, start, or stop Compose assets."], ["dashboard", "Start the authenticated loopback dashboard."], ["config", "Read, update, import, or export safe configuration."], ["upgrade", "Upgrade managed workspace state or roll back."],
];

export function documentationSources() {
  return {
    "cli.md": table("Generated CLI Reference", ["Command", "Purpose"], COMMANDS.map(([command, purpose]) => [`\`${command}\``, purpose])),
    "providers.md": table("Generated Provider Reference", ["Provider", "Kind", "Capabilities", "Credential source"], listProviderProfiles().map((provider) => [`\`${provider.name}\``, provider.kind, provider.capabilities.join(", "), provider.environmentVariable ? `\`${provider.environmentVariable}\`` : "host-managed"])),
    "modules.md": table("Generated Module Reference", ["Module", "Lifecycle"], supportedModules().map((module) => [`\`${module}\``, "initialize, install, update, validate, status, remove, rollback"])),
    "templates.md": table("Generated Template Reference", ["Template", "Availability"], listTemplates().map((template) => [`\`${template}\``, "built-in; exportable as package"])),
  };
}

export async function generateCanonicalDocumentation(root, { dryRun = true } = {}) {
  const sources = documentationSources();
  const manifest = documentationManifest(sources);
  const files = { ...sources, "manifest.json": `${JSON.stringify(manifest, null, 2)}\n` };
  const create = [], skipped = [];
  for (const [name, contents] of Object.entries(files)) ((await exists(path.join(root, OUTPUT_ROOT, name))) ? skipped : create).push({ name, contents });
  const plan = { dryRun, output: OUTPUT_ROOT, create: create.map(({ name }) => name), skipped: skipped.map(({ name }) => name), overwrite: false, manifest };
  if (dryRun) return plan;
  await mkdir(path.join(root, OUTPUT_ROOT), { recursive: true });
  for (const file of create) await writeFile(path.join(root, OUTPUT_ROOT, file.name), file.contents, { encoding: "utf8", flag: "wx" });
  return { ...plan, dryRun: false, created: create.map(({ name }) => name) };
}

export async function verifyCanonicalDocumentation(root) {
  const expected = documentationSources();
  const issues = [];
  for (const [name, contents] of Object.entries(expected)) {
    const target = path.join(root, OUTPUT_ROOT, name);
    try { if (normalizeLineEndings(await readFile(target, "utf8")) !== normalizeLineEndings(contents)) issues.push(`${name} differs from source metadata.`); }
    catch { issues.push(`${name} is missing.`); }
  }
  try { const actual = JSON.parse(await readFile(path.join(root, OUTPUT_ROOT, "manifest.json"), "utf8")); const expectedManifest = documentationManifest(expected); if (JSON.stringify(actual) !== JSON.stringify(expectedManifest)) issues.push("manifest.json differs from generated checksums."); }
  catch { issues.push("manifest.json is missing or invalid."); }
  return { valid: issues.length === 0, issues, output: OUTPUT_ROOT, files: Object.keys(expected) };
}

function documentationManifest(sources) { return { schemaVersion: 1, generator: "forgevena", files: Object.fromEntries(Object.entries(sources).sort(([left], [right]) => left.localeCompare(right)).map(([name, contents]) => [name, createHash("sha256").update(contents).digest("hex")])) }; }
function table(title, headers, rows) { return `# ${title}\n\n> Generated from Forgevena source metadata. Do not edit manually.\n\n| ${headers.join(" | ")} |\n|${headers.map(() => "---").join("|")}|\n${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n`; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
function normalizeLineEndings(value) { return value.replace(/\r\n/g, "\n"); }
