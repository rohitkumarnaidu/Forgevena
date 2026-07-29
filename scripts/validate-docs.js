import { readFile, readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import { validateGovernance } from "../src/governance-validation.js";
import { verifyCanonicalDocumentation } from "../src/documentation-generator.js";
import { validateDocumentationAssets } from "../src/documentation-assets.js";
import { generateVersionDocumentation } from "../src/version-documentation.js";

const root = process.cwd();
const docsRoot = path.join(root, "docs");
const markdown = await walk(docsRoot, ".md");
const issues = [];
let mermaidBlocks = 0;
let headings = 0;

for (const file of markdown) {
  const contents = await readFile(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const lines = contents.split(/\r?\n/);
  const anchors = new Set();
  let previousHeading = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[index]);
    if (!match) continue;
    headings += 1;
    const level = match[1].length;
    if (previousHeading && level > previousHeading + 1) issues.push(`${relative}:${index + 1} heading level skips from H${previousHeading} to H${level}`);
    previousHeading = level;
    const anchor = match[2].toLowerCase().replace(/[`*_~]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    if (anchors.has(anchor)) issues.push(`${relative}:${index + 1} duplicate heading anchor ${anchor}`);
    anchors.add(anchor);
  }
  mermaidBlocks += (contents.match(/```mermaid\b/g) ?? []).length;
  for (const match of contents.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    try { await access(resolved); } catch { issues.push(`${relative} broken local reference ${target}`); }
  }
}

const config = await readFile(path.join(root, "website", "mkdocs.yml"), "utf8");
for (const required of ["search:", "provider: mike", "navigation.path", "pymdownx.superfences"]) {
  if (!config.includes(required)) issues.push(`website/mkdocs.yml missing ${required}`);
}
try { await access(path.join(docsRoot, "404.md")); } catch { issues.push("docs/404.md is missing"); }
if ((config.match(/^site_description:/gm) ?? []).length !== 1) issues.push("website/mkdocs.yml must define site_description exactly once");

const generated = await verifyCanonicalDocumentation(root);
issues.push(...generated.issues.map((issue) => `generated documentation: ${issue}`));

const governance = await validateGovernance(root);
issues.push(...governance.issues.map((issue) => `governance: ${issue}`));

const assets = await validateDocumentationAssets(root);
issues.push(...assets.issues.map((issue) => `documentation assets: ${issue}`));

const versionDocumentation = await generateVersionDocumentation(root);
issues.push(...versionDocumentation.issues.map((issue) => `version documentation: ${issue}`));

const report = { valid: issues.length === 0, markdownFiles: markdown.length, headings, mermaidBlocks, generated, governance, assets, versionDocumentation, issues };
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;

async function walk(directory, extension) {
  const entries = [];
  for (const name of await readdir(directory)) {
    const target = path.join(directory, name);
    const metadata = await stat(target);
    if (metadata.isDirectory()) entries.push(...await walk(target, extension));
    else if (target.endsWith(extension)) entries.push(target);
  }
  return entries;
}
