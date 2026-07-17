import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const INDEX_PATH = path.join(".ai-workspace", "index", "project-index.json");
const EXCLUDED = new Set([".git", ".ai-workspace", "node_modules", "dist", "build", "coverage", "cache", "backups", "site", ".next", ".venv", "venv"]);
const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".go", ".rs", ".java", ".kt"]);
const DOCUMENT_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);
const MANIFEST_NAMES = new Set(["package.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml", "build.gradle", "pubspec.yaml", "docker-compose.yml", "docker-compose.yaml"]);

export async function buildProjectIndex(root, { dryRun = true } = {}) {
  const files = await discoverFiles(root);
  const records = [];
  for (const relative of files) records.push(await indexFile(root, relative));
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root: ".",
    files: records.map(({ relationships: _relationships, ...record }) => record),
    symbols: records.flatMap((record) => record.symbols.map((symbol) => ({ ...symbol, file: record.path }))),
    relationships: records.flatMap((record) => record.relationships),
    counts: { files: records.length, source: records.filter(({ kind }) => kind === "source").length, documents: records.filter(({ kind }) => kind === "document").length, manifests: records.filter(({ kind }) => kind === "manifest").length, symbols: records.reduce((total, record) => total + record.symbols.length, 0), relationships: records.reduce((total, record) => total + record.relationships.length, 0) },
    contentStored: false,
  };
  const plan = { dryRun, path: INDEX_PATH, counts: index.counts, contentStored: false };
  if (dryRun) return { ...plan, preview: { files: index.files.map(({ path: file, kind }) => ({ path: file, kind })), symbols: index.symbols.slice(0, 50), relationships: index.relationships.slice(0, 50) } };
  await writeStateDocument(root, INDEX_PATH, index, validateIndex);
  return { ...plan, dryRun: false, indexed: true, generatedAt: index.generatedAt };
}

export async function projectIndexStatus(root) {
  const index = await readStateDocument(root, INDEX_PATH, null, (value) => value === null || validateIndex(value));
  return index ? { indexed: true, generatedAt: index.generatedAt, counts: index.counts, contentStored: index.contentStored } : { indexed: false, path: INDEX_PATH, contentStored: false };
}

export async function readProjectIndex(root) { const index = await readStateDocument(root, INDEX_PATH, null, (value) => value === null || validateIndex(value)); if (!index) throw new Error("Project index is not initialized. Run index build --apply."); return index; }

export async function queryProjectIndex(root, query, { limit = 20 } = {}) {
  if (!String(query ?? "").trim()) throw new Error("Index query must not be empty.");
  const index = await readStateDocument(root, INDEX_PATH, null, (value) => value === null || validateIndex(value));
  if (!index) throw new Error("Project index is not initialized. Run index build --apply.");
  const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  const candidates = [
    ...index.files.map((file) => ({ type: "file", id: file.path, text: `${file.path} ${file.kind}` })),
    ...index.symbols.map((symbol) => ({ type: "symbol", id: `${symbol.file}#${symbol.name}`, text: `${symbol.name} ${symbol.kind} ${symbol.file}`, details: symbol })),
    ...index.relationships.map((relationship) => ({ type: "relationship", id: `${relationship.from}->${relationship.to}`, text: `${relationship.from} ${relationship.type} ${relationship.to}`, details: relationship })),
  ];
  const results = candidates.map((candidate) => ({ ...candidate, score: terms.reduce((score, term) => score + (candidate.text.toLowerCase().includes(term) ? 1 : 0), 0) })).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id)).slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
  return { query, results, semantic: false, contentReturned: false };
}

export async function projectRecommendations(root) {
  const index = await readProjectIndex(root);
  const paths = new Set(index.files.map(({ path: file }) => file.toLowerCase()));
  const recommendations = [];
  recommend(![...paths].some((file) => /(^|\/)readme\.md$/.test(file)), "DOCS_README_MISSING", "medium", "Add a project README describing purpose, setup, and supported workflows.", []);
  recommend(index.counts.documents === 0, "DOCS_MISSING", "medium", "Add architecture, security, testing, deployment, and operations documentation.", []);
  recommend(index.counts.source > 0 && ![...paths].some((file) => /(^|\/)(test|tests|__tests__)(\/|$)|\.(test|spec)\.[^.]+$/.test(file)), "TESTS_NOT_DETECTED", "high", "Add automated tests for the indexed source modules.", [{ metric: "sourceFiles", value: index.counts.source }]);
  recommend(![...paths].some((file) => /(^|\/)docs\/(architecture|adr)(\/|\.)/.test(file)), "ARCHITECTURE_DOCS_MISSING", "medium", "Document architecture and material decisions before introducing structural changes.", []);
  recommend(![...paths].some((file) => /(^|\/)(security\.md|docs\/security)(\/|$|\.)/.test(file)), "SECURITY_DOCS_MISSING", "high", "Document assets, trust boundaries, secret handling, and vulnerability reporting.", []);
  recommend(index.counts.source > 0 && index.counts.symbols === 0, "SOURCE_SYMBOLS_NOT_DETECTED", "low", "Review unsupported source syntax or add language-aware indexing support.", [{ metric: "sourceFiles", value: index.counts.source }]);
  return { generatedAt: new Date().toISOString(), indexGeneratedAt: index.generatedAt, readOnly: true, contentInspected: false, projectFilesChanged: false, recommendations: recommendations.sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || left.id.localeCompare(right.id)) };

  function recommend(condition, id, severity, message, evidence) { if (condition) recommendations.push({ id, severity, message, evidence, mutationRequiresPreviewAndConsent: true }); }
}

async function discoverFiles(root) { const result = []; async function walk(relative = "") { let entries; try { entries = await readdir(path.join(root, relative), { withFileTypes: true }); } catch (error) { if (["EACCES", "EPERM"].includes(error?.code)) return; throw error; } for (const entry of entries) { const next = path.join(relative, entry.name); if (entry.isDirectory()) { if (!EXCLUDED.has(entry.name)) await walk(next); } else if (isIndexable(entry.name)) result.push(next.replaceAll("\\", "/")); } } await walk(); return result.sort(); }
function isIndexable(name) { return SOURCE_EXTENSIONS.has(path.extname(name).toLowerCase()) || DOCUMENT_EXTENSIONS.has(path.extname(name).toLowerCase()) || MANIFEST_NAMES.has(name); }

async function indexFile(root, relative) {
  const contents = await readFile(path.join(root, relative), "utf8");
  const extension = path.extname(relative).toLowerCase();
  const kind = MANIFEST_NAMES.has(path.basename(relative)) ? "manifest" : DOCUMENT_EXTENSIONS.has(extension) ? "document" : "source";
  const symbols = kind === "source" ? sourceSymbols(contents, extension) : kind === "document" ? documentSymbols(contents) : manifestSymbols(contents, path.basename(relative));
  const relationships = kind === "source" ? sourceRelationships(relative, contents, extension) : kind === "document" ? documentRelationships(relative, contents) : manifestRelationships(relative, contents, path.basename(relative));
  return { path: relative, kind, bytes: Buffer.byteLength(contents), sha256: createHash("sha256").update(contents).digest("hex"), symbols, relationships };
}

function sourceSymbols(contents, extension) {
  const patterns = extension === ".py" ? [[/^(?:async\s+)?def\s+([A-Za-z_]\w*)/gm, "function"], [/^class\s+([A-Za-z_]\w*)/gm, "class"]] : extension === ".go" ? [[/^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)/gm, "function"], [/^type\s+([A-Za-z_]\w*)\s+(?:struct|interface)/gm, "type"]] : extension === ".rs" ? [[/^(?:pub\s+)?fn\s+([A-Za-z_]\w*)/gm, "function"], [/^(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z_]\w*)/gm, "type"]] : [[/\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, "function"], [/\b(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g, "class"], [/\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g, "variable"]];
  return matches(contents, patterns);
}
function documentSymbols(contents) { return [...contents.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({ name: match[2].trim(), kind: "heading", line: lineNumber(contents, match.index) })); }
function manifestSymbols(contents, name) { if (name !== "package.json") return []; try { const value = JSON.parse(contents); return Object.keys({ ...(value.dependencies ?? {}), ...(value.devDependencies ?? {}) }).sort().map((dependency) => ({ name: dependency, kind: "dependency", line: 1 })); } catch { return []; } }
function sourceRelationships(relative, contents, extension) { const patterns = extension === ".py" ? [/^(?:from\s+([^\s]+)\s+import|import\s+([^\s,]+))/gm] : [/\bimport\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g, /\bexport\s+[^'"\n]*?\s+from\s+['"]([^'"]+)['"]/g, /\brequire\(['"]([^'"]+)['"]\)/g]; return patterns.flatMap((pattern) => [...contents.matchAll(pattern)].map((match) => ({ from: relative, to: match[1] ?? match[2], type: "imports" }))); }
function documentRelationships(relative, contents) { return [...contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].filter((match) => !/^(?:https?:|mailto:|#)/i.test(match[1])).map((match) => ({ from: relative, to: match[1].split("#")[0], type: "links" })); }
function manifestRelationships(relative, contents, name) { if (name !== "package.json") return []; try { const value = JSON.parse(contents); return Object.entries({ ...(value.dependencies ?? {}), ...(value.devDependencies ?? {}) }).map(([dependency, version]) => ({ from: relative, to: dependency, type: "depends-on", version: String(version) })); } catch { return []; } }
function matches(contents, patterns) { return patterns.flatMap(([pattern, kind]) => [...contents.matchAll(pattern)].map((match) => ({ name: match[1], kind, line: lineNumber(contents, match.index) }))).sort((left, right) => left.line - right.line || left.name.localeCompare(right.name)); }
function lineNumber(contents, index) { return contents.slice(0, index).split("\n").length; }
function validateIndex(value) { return value?.schemaVersion === 1 && Array.isArray(value.files) && Array.isArray(value.symbols) && Array.isArray(value.relationships) && value.contentStored === false ? true : ["Project index document is invalid."]; }
function severityRank(value) { return { low: 1, medium: 2, high: 3 }[value] ?? 0; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
