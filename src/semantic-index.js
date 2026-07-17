import path from "node:path";
import { readCredential } from "./credentials.js";
import { readProjectIndex } from "./project-index.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const CONFIG_PATH = path.join(".ai-workspace", "index", "semantic-config.json");
const INDEX_PATH = path.join(".ai-workspace", "index", "semantic-index.json");
const PROVIDERS = {
  openai: { model: "text-embedding-3-small", credential: "OPENAI_API_KEY", external: true },
  gemini: { model: "gemini-embedding-001", credential: "GEMINI_API_KEY", external: true },
  ollama: { model: "embeddinggemma", credential: null, external: false },
};
const METADATA_FIELDS = new Set(["path", "kind", "symbols", "relationships"]);

export async function configureSemanticIndex(root, updates, { dryRun = true } = {}) {
  const current = await readSemanticConfig(root);
  const provider = updates.provider ?? current.provider;
  if (!PROVIDERS[provider]) throw new Error(`Semantic provider must be one of: ${Object.keys(PROVIDERS).join(", ")}.`);
  const metadataFields = [...new Set((updates.metadataFields ?? current.metadataFields).map(String))];
  if (!metadataFields.includes("path") || metadataFields.some((field) => !METADATA_FIELDS.has(field))) throw new Error(`Approved metadata fields must include path and use: ${[...METADATA_FIELDS].join(", ")}.`);
  const next = { schemaVersion: 1, enabled: updates.enabled ?? current.enabled, provider, model: updates.model ?? current.model ?? PROVIDERS[provider].model, metadataFields, maxEntries: bounded(updates.maxEntries ?? current.maxEntries, 1, 5000), storesSourceContent: false };
  const plan = { dryRun, path: CONFIG_PATH, previous: current, next, storesCredentials: false, storesSourceContent: false };
  if (dryRun) return plan;
  await writeStateDocument(root, CONFIG_PATH, next, validateConfig);
  return { ...plan, dryRun: false, configured: true };
}

export async function semanticIndexPlan(root, action = "build") {
  const config = await readSemanticConfig(root);
  const provider = PROVIDERS[config.provider];
  return { action, provider: config.provider, model: config.model, enabled: config.enabled, external: provider.external, command: `semantic ${action} using ${config.provider}/${config.model}`, scope: provider.external ? `${config.provider} embedding API` : "local Ollama endpoint", dataImpact: action === "query" ? "Sends the search query for embedding." : `Sends only approved project metadata fields: ${config.metadataFields.join(", ")}. Source contents are not sent.`, affectedPaths: action === "build" ? [INDEX_PATH] : [], rollback: action === "build" ? "Rebuild the managed semantic index or restore state snapshot." : "No local state changes.", credential: provider.credential, storesSourceContent: false };
}

export async function buildSemanticIndex(root, { embedImpl = embedTexts } = {}) {
  const config = await readSemanticConfig(root);
  if (!config.enabled) throw new Error("Semantic indexing is disabled. Configure it with enabled=true first.");
  const project = await readProjectIndex(root);
  const entries = project.files.slice(0, config.maxEntries).map((file) => approvedEntry(project, file, config.metadataFields));
  const vectors = await embedImpl(root, config.provider, config.model, entries.map(({ text }) => text));
  validateVectors(vectors, entries.length);
  const document = { schemaVersion: 1, generatedAt: new Date().toISOString(), provider: config.provider, model: config.model, dimensions: vectors[0]?.length ?? 0, metadataFields: config.metadataFields, entries: entries.map(({ text: _text, metadata }, index) => ({ id: metadata.path, metadata, vector: vectors[index] })), storesSourceContent: false, storesCredentials: false };
  await writeStateDocument(root, INDEX_PATH, document, validateSemanticIndex);
  return { indexed: true, provider: config.provider, model: config.model, entries: document.entries.length, dimensions: document.dimensions, metadataFields: config.metadataFields, storesSourceContent: false };
}

export async function querySemanticIndex(root, query, { limit = 10, embedImpl = embedTexts } = {}) {
  if (!String(query ?? "").trim()) throw new Error("Semantic query must not be empty.");
  const index = await readStateDocument(root, INDEX_PATH, null, (value) => value === null || validateSemanticIndex(value));
  if (!index) throw new Error("Semantic index is not initialized. Run semantic build --apply --yes.");
  const [vector] = await embedImpl(root, index.provider, index.model, [String(query)]);
  validateVectors([vector], 1);
  const results = index.entries.map((entry) => ({ id: entry.id, metadata: entry.metadata, score: cosine(vector, entry.vector) })).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id)).slice(0, Math.max(1, Math.min(Number(limit) || 10, 100)));
  return { query, provider: index.provider, model: index.model, results, sourceContentReturned: false };
}

export async function semanticIndexStatus(root) { const [config, index] = await Promise.all([readSemanticConfig(root), readStateDocument(root, INDEX_PATH, null, (value) => value === null || validateSemanticIndex(value))]); return { config, indexed: Boolean(index), generatedAt: index?.generatedAt ?? null, entries: index?.entries.length ?? 0, dimensions: index?.dimensions ?? 0, storesSourceContent: false, storesCredentials: false }; }

export async function embedTexts(root, provider, model, inputs, { fetchImpl = globalThis.fetch } = {}) {
  if (!PROVIDERS[provider]) throw new Error(`Unsupported embedding provider: ${provider}.`);
  const credential = PROVIDERS[provider].credential ? await readCredential(root, PROVIDERS[provider].credential) : null;
  if (PROVIDERS[provider].credential && !credential) throw new Error(`Missing ${PROVIDERS[provider].credential}.`);
  if (provider === "openai") { const payload = await request(fetchImpl, "https://api.openai.com/v1/embeddings", { model, input: inputs, encoding_format: "float" }, { authorization: `Bearer ${credential}` }); return payload.data?.sort((left, right) => left.index - right.index).map(({ embedding }) => embedding) ?? []; }
  if (provider === "ollama") { const base = (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, ""); const payload = await request(fetchImpl, `${base}/api/embed`, { model, input: inputs, truncate: true }); return payload.embeddings ?? []; }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents`;
  const requests = inputs.map((text) => ({ model: `models/${model}`, content: { parts: [{ text }] }, embedContentConfig: { taskType: "RETRIEVAL_DOCUMENT" } }));
  const payload = await request(fetchImpl, endpoint, { requests }, { "x-goog-api-key": credential });
  return payload.embeddings?.map(({ values }) => values) ?? [];
}

async function readSemanticConfig(root) { return { schemaVersion: 1, enabled: false, provider: "ollama", model: PROVIDERS.ollama.model, metadataFields: ["path", "kind", "symbols"], maxEntries: 1000, storesSourceContent: false, ...(await readStateDocument(root, CONFIG_PATH, {}, validateConfig)) }; }
function approvedEntry(project, file, fields) { const metadata = {}; if (fields.includes("path")) metadata.path = file.path; else metadata.path = file.path; if (fields.includes("kind")) metadata.kind = file.kind; if (fields.includes("symbols")) metadata.symbols = project.symbols.filter((symbol) => symbol.file === file.path).map(({ name, kind }) => ({ name, kind })); if (fields.includes("relationships")) metadata.relationships = project.relationships.filter(({ from }) => from === file.path).map(({ type, to }) => ({ type, to })); const text = [metadata.path, metadata.kind, ...(metadata.symbols ?? []).flatMap(({ name, kind }) => [name, kind]), ...(metadata.relationships ?? []).flatMap(({ type, to }) => [type, to])].filter(Boolean).join(" "); return { metadata, text }; }
async function request(fetchImpl, url, body, headers = {}) { const response = await fetchImpl(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) }); const text = await response.text(); const payload = text ? JSON.parse(text) : {}; if (!response.ok) throw new Error(`Embedding request failed with HTTP ${response.status}.`); return payload; }
function validateVectors(vectors, expected) { if (!Array.isArray(vectors) || vectors.length !== expected || vectors.some((vector) => !Array.isArray(vector) || !vector.length || vector.some((value) => !Number.isFinite(Number(value))))) throw new Error("Embedding provider returned an invalid vector batch."); }
function cosine(left, right) { if (left.length !== right.length) return -1; let dot = 0, leftNorm = 0, rightNorm = 0; for (let index = 0; index < left.length; index += 1) { dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2; } return leftNorm && rightNorm ? dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) : 0; }
function bounded(value, minimum, maximum) { const number = Number(value); if (!Number.isInteger(number) || number < minimum || number > maximum) throw new Error(`Value must be an integer between ${minimum} and ${maximum}.`); return number; }
function validateConfig(value) { return value && value.schemaVersion === 1 && PROVIDERS[value.provider] && Array.isArray(value.metadataFields) && value.storesSourceContent === false ? true : ["Semantic index configuration is invalid."]; }
function validateSemanticIndex(value) { return value?.schemaVersion === 1 && Array.isArray(value.entries) && value.storesSourceContent === false && value.storesCredentials === false ? true : ["Semantic index document is invalid."]; }
