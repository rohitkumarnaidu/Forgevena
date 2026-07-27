import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { detectProject } from "../src/doctor.js";
import { loadConfig } from "../src/config.js";
import { listTemplates } from "../src/template-catalog.js";
import { initializeProject, readStatus } from "../src/project.js";
import { listProviderProfiles } from "../src/providers.js";
import { FileStateEngine } from "../src/state-engine.js";

const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-benchmark-"));
const metrics = {};
const executeFile = promisify(execFile);
try {
  metrics.projectDetectionMs = await measure(() => detectProject(root));
  metrics.configurationLoadMs = await measure(() => loadConfig(root));
  metrics.templateCatalogMs = await measure(() => listTemplates());
  metrics.providerCatalogMs = await measure(() => listProviderProfiles());
  metrics.bootstrapPreviewMs = await measure(() => initializeProject(root, { dryRun: true }));
  metrics.bootstrapApplyMs = await measure(() => initializeProject(root, { dryRun: false }));
  metrics.registryStatusMs = await measure(() => readStatus(root));
  const state = new FileStateEngine(root);
  await state.write(".ai-workspace/benchmark.json", { schemaVersion: 1, value: "benchmark" });
  metrics.stateReadMs = await averageMeasure(() => state.read(".ai-workspace/benchmark.json"), 20);
  metrics.warmCliStartupMs = await measure(() => executeFile(process.execPath, [path.resolve("bin/forgevena.js"), "version"], { cwd: process.cwd(), windowsHide: true }));
  metrics.memoryRssMiB = Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));
  const budgets = { projectDetectionMs: 250, configurationLoadMs: 100, templateCatalogMs: 100, providerCatalogMs: 100, bootstrapPreviewMs: 1000, bootstrapApplyMs: 3000, registryStatusMs: 500, stateReadMs: 50, warmCliStartupMs: 250, memoryRssMiB: 150 };
  const violations = Object.entries(budgets).filter(([name, budget]) => metrics[name] > budget).map(([name, budget]) => ({ name, actual: metrics[name], budget }));
  console.log(JSON.stringify({ metrics, budgets, violations, valid: violations.length === 0 }, null, 2));
  if (violations.length) process.exitCode = 1;
} finally { await rm(root, { recursive: true, force: true }); }

async function measure(work) { const start = performance.now(); await work(); return Number((performance.now() - start).toFixed(2)); }
async function averageMeasure(work, iterations) { const start = performance.now(); for (let index = 0; index < iterations; index += 1) await work(); return Number(((performance.now() - start) / iterations).toFixed(2)); }
