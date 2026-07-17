import { randomUUID } from "node:crypto";
import { access, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { inspectEcosystem } from "./ecosystem-health.js";
import { redact } from "./logging.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";
import { versionInfo } from "./version.js";

const METRICS_PATH = path.join(".ai-workspace", "diagnostics", "metrics.json");
const TRACES_PATH = path.join(".ai-workspace", "diagnostics", "traces.json");
const CRASH_PATH = path.join(".ai-workspace", "diagnostics", "crashes.json");
const BUNDLE_ROOT = path.join(".ai-workspace", "diagnostics", "bundles");

export async function recordMetric(root, name, value, labels = {}) {
  if (!/^[a-z][a-z0-9_.-]{0,127}$/i.test(name)) throw new Error("Metric name must use safe characters.");
  if (!Number.isFinite(Number(value))) throw new Error("Metric value must be finite.");
  const document = await readMetrics(root);
  const metric = document.metrics[name] ?? { count: 0, sum: 0, min: null, max: null, last: null, labels: {} };
  const number = Number(value);
  Object.assign(metric, { count: metric.count + 1, sum: metric.sum + number, min: metric.min === null ? number : Math.min(metric.min, number), max: metric.max === null ? number : Math.max(metric.max, number), last: number, labels: safeLabels(labels), updatedAt: new Date().toISOString() });
  document.metrics[name] = metric;
  await writeStateDocument(root, METRICS_PATH, document, validateMetrics);
  return { metric: name, recorded: true, aggregate: metric };
}

export async function measureOperation(root, name, work, attributes = {}) {
  const traceId = randomUUID();
  const started = performance.now();
  const startedAt = new Date().toISOString();
  try {
    const result = await work();
    const durationMs = Number((performance.now() - started).toFixed(3));
    await Promise.all([recordMetric(root, `${name}.duration_ms`, durationMs), recordTrace(root, { traceId, name, status: "success", startedAt, durationMs, attributes })]);
    return result;
  } catch (error) {
    const durationMs = Number((performance.now() - started).toFixed(3));
    await Promise.all([recordMetric(root, `${name}.duration_ms`, durationMs), recordTrace(root, { traceId, name, status: "error", startedAt, durationMs, attributes, errorCode: error.code ?? "UNEXPECTED_ERROR" })]);
    throw error;
  }
}

export async function recordTrace(root, span) {
  const document = await readTraces(root);
  document.spans.push(redact({ ...span, recordedAt: new Date().toISOString() }));
  document.spans = document.spans.slice(-500);
  await writeStateDocument(root, TRACES_PATH, document, validateTraces);
  return { traceId: span.traceId, recorded: true };
}

export async function recordCrash(root, error, context = {}) {
  const document = await readStateDocument(root, CRASH_PATH, { schemaVersion: 1, crashes: [] }, validateCrashes);
  document.crashes.push(redact({ id: randomUUID(), at: new Date().toISOString(), code: error.code ?? "UNEXPECTED_ERROR", message: error.message, context }));
  document.crashes = document.crashes.slice(-100);
  await writeStateDocument(root, CRASH_PATH, document, validateCrashes);
  return { recorded: true, crashId: document.crashes.at(-1).id };
}

export async function diagnosticsHealth(root) {
  const [ecosystem, metrics, traces, crashes] = await Promise.all([inspectEcosystem(root), readMetrics(root), readTraces(root), readStateDocument(root, CRASH_PATH, { schemaVersion: 1, crashes: [] }, validateCrashes)]);
  return { healthy: ecosystem.healthy, checkedAt: ecosystem.checkedAt, ecosystem: ecosystem.counts, diagnostics: { metrics: Object.keys(metrics.metrics).length, spans: traces.spans.length, crashes: crashes.crashes.length }, secretsIncluded: false };
}

export async function diagnosticsProfile(root) {
  const started = performance.now();
  const [metrics, traces, logFiles] = await Promise.all([readMetrics(root), readTraces(root), logInventory(root)]);
  return { generatedAt: new Date().toISOString(), generationMs: Number((performance.now() - started).toFixed(3)), process: { node: process.version, platform: process.platform, arch: process.arch, rssMiB: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)) }, metrics: metrics.metrics, traceSummary: summarizeTraces(traces.spans), logs: logFiles, secretsIncluded: false };
}

export async function createDiagnosticBundle(root, { dryRun = true } = {}) {
  const id = randomUUID();
  const relative = path.join(BUNDLE_ROOT, `${id}.json`);
  const plan = { bundleId: id, path: relative, dryRun, create: [relative], includes: ["version", "health summary", "metric aggregates", "trace summary", "log inventory", "crash codes"], excludes: ["prompts", "responses", "keys", "tokens", "credential metadata", "log contents"] };
  if (dryRun) return plan;
  const [health, profile, crashes] = await Promise.all([diagnosticsHealth(root), diagnosticsProfile(root), readStateDocument(root, CRASH_PATH, { schemaVersion: 1, crashes: [] }, validateCrashes)]);
  const bundle = redact({ schemaVersion: 1, bundleId: id, generatedAt: new Date().toISOString(), version: versionInfo(), health, profile, crashes: crashes.crashes.map(({ id: crashId, at, code }) => ({ id: crashId, at, code })), dataPolicy: { includes: plan.includes, excludes: plan.excludes }, secretsIncluded: false });
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(bundle, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return { ...plan, dryRun: false, created: true };
}

export async function readMetrics(root) { return { schemaVersion: 1, metrics: {}, ...(await readStateDocument(root, METRICS_PATH, { schemaVersion: 1, metrics: {} }, validateMetrics)) }; }
export async function readTraces(root) { return { schemaVersion: 1, spans: [], ...(await readStateDocument(root, TRACES_PATH, { schemaVersion: 1, spans: [] }, validateTraces)) }; }

async function logInventory(root) { const directory = path.join(root, ".ai-workspace", "logs"); if (!(await exists(directory))) return []; return Promise.all((await readdir(directory)).sort().map(async (name) => { const info = await stat(path.join(directory, name)); return { name, bytes: info.size, modifiedAt: info.mtime.toISOString(), contentsIncluded: false }; })); }
function summarizeTraces(spans) { const grouped = {}; for (const span of spans) { const item = grouped[span.name] ?? { count: 0, errors: 0, totalDurationMs: 0 }; item.count += 1; item.errors += span.status === "error" ? 1 : 0; item.totalDurationMs += Number(span.durationMs ?? 0); grouped[span.name] = item; } return grouped; }
function safeLabels(labels) { return Object.fromEntries(Object.entries(redact(labels)).map(([key, value]) => [String(key).slice(0, 64), String(value).slice(0, 128)])); }
function validateMetrics(value) { return value?.schemaVersion === 1 && value.metrics && typeof value.metrics === "object" ? true : ["Metrics document is invalid."]; }
function validateTraces(value) { return value?.schemaVersion === 1 && Array.isArray(value.spans) ? true : ["Trace document is invalid."]; }
function validateCrashes(value) { return value?.schemaVersion === 1 && Array.isArray(value.crashes) ? true : ["Crash document is invalid."]; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
