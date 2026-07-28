import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const documents = [
  "docs/README.md", "docs/index.md", "docs/getting-started/index.md", "docs/installation/index.md", "docs/architecture/overview.md",
  "docs/architecture/diagrams.md", "docs/cli/reference.md", "docs/modules/reference.md",
  "docs/capabilities/reference.md", "docs/integrations/reference.md", "docs/providers/reference.md",
  "docs/templates/reference.md", "docs/bootstrap/guide.md", "docs/configuration/reference.md",
  "docs/registry/reference.md", "docs/plugins/guide.md", "docs/security/guide.md",
  "docs/deployment/guide.md", "docs/operations/runbooks.md", "docs/testing/guide.md",
  "docs/developer/index.md", "docs/maintainer/index.md", "docs/troubleshooting/index.md",
  "docs/reference/environment-variables.md", "docs/reference/exit-codes.md",
  "docs/adrs/index.md", "docs/glossary/index.md", "docs/schemas/index.md", "docs/release/index.md",
  "docs/REPOSITORY_MAP.md", "docs/OPEN_SOURCE_V1_READINESS.md", "docs/DOCUMENTATION_COVERAGE.md",
  "docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md", "docs/governance/DOCUMENTATION_AUTHORITY_MAP.md",
  "docs/strategy/RESEARCH_AND_STANDARDS_RADAR.md", "docs/reports/ENTERPRISE_DOCUMENTATION_AUDIT_REPORT.md",
  "docs/reference/schemas/document-catalog.schema.json", "docs/reference/generated/documentation-catalog.json",
  "docs/reference/generated/documentation-health.md", "docs/reference/generated/documentation-coverage-matrix.md",
  "docs/reference/generated/ai-documentation-index.md", "docs/reference/generated/historical-document-index.md",
];

test("canonical documentation hierarchy exists", async () => {
  await Promise.all(documents.map((document) => access(path.join(root, document))));
});

test("documented catalogs cover source-defined surfaces", async () => {
  const catalogs = {
    modules: await readFile(path.join(root, "docs/modules/reference.md"), "utf8"),
    integrations: await readFile(path.join(root, "docs/integrations/reference.md"), "utf8"),
    providers: await readFile(path.join(root, "docs/providers/reference.md"), "utf8"),
    capabilities: await readFile(path.join(root, "docs/capabilities/reference.md"), "utf8"),
    templates: await readFile(path.join(root, "docs/templates/reference.md"), "utf8"),
  };
  for (const name of ["core", "doctor", "bootstrap", "registry", "logging", "config", "templates", "providers", "project", "docs", "design", "testing", "docker", "monitoring", "github", "ai"]) assert.match(catalogs.modules, new RegExp(`\\b${name}\\b`, "i"));
  for (const name of ["OpenSpec", "SkillOpt", "gstack", "design.md", "Astryx", "claude-mem", "GitNexus", "Understand Anything"]) assert.match(catalogs.integrations, new RegExp(name.replace(".", "\\."), "i"));
  for (const name of ["OpenAI", "Claude", "Gemini", "OpenRouter", "Ollama", "Codex", "Cursor", "Windsurf"]) assert.match(catalogs.providers, new RegExp(name, "i"));
  for (const name of ["specification management", "skill optimization", "AI workflow", "design system", "persistent memory", "code intelligence", "repository knowledge graph"]) assert.match(catalogs.capabilities, new RegExp(name, "i"));
  for (const name of ["react", "nextjs", "fastapi", "express", "flutter", "python", "ai-agent", "rag", "full-stack-ai", "microservices", "library", "cli", "blank", "enterprise"]) assert.match(catalogs.templates, new RegExp(`\\b${name}\\b`, "i"));
});

test("CLI reference covers every top-level command", async () => {
  const cli = await readFile(path.join(root, "docs/cli/reference.md"), "utf8");
  for (const command of ["doctor", "status", "validate", "version", "create", "init", "add", "remove", "update", "rollback", "templates", "capabilities", "integrations", "install", "reference", "providers", "credentials", "mcp", "plugins", "cloud", "docker", "dashboard", "config", "upgrade"]) assert.match(cli, new RegExp(`\\b${command}\\b`, "i"));
});
