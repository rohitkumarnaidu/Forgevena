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
import { averageDuration, measureDuration, medianDuration } from "../src/performance-metrics.js";

const root = await mkdtemp(path.join(tmpdir(), "ai-workspace-benchmark-"));
const metrics = {};
const executeFile = promisify(execFile);
try {
  metrics.projectDetectionMs = await measureDuration(() => detectProject(root));
  metrics.configurationLoadMs = await measureDuration(() => loadConfig(root));
  metrics.templateCatalogMs = await measureDuration(() => listTemplates());
  metrics.providerCatalogMs = await measureDuration(() => listProviderProfiles());
  metrics.bootstrapPreviewMs = await measureDuration(() => initializeProject(root, { dryRun: true }));
  metrics.bootstrapApplyMs = await measureDuration(() => initializeProject(root, { dryRun: false }));
  metrics.registryStatusMs = await measureDuration(() => readStatus(root));
  const state = new FileStateEngine(root);
  await state.write(".ai-workspace/benchmark.json", { schemaVersion: 1, value: "benchmark" });
  metrics.stateReadMs = await averageDuration(() => state.read(".ai-workspace/benchmark.json"), 20);
  metrics.warmCliStartupMs = await medianDuration(
    () => executeFile(process.execPath, [path.resolve("bin/forgevena.js"), "version"], { cwd: process.cwd(), windowsHide: true }),
    { iterations: 5, warmups: 1 },
  );
  metrics.memoryRssMiB = Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));
  const budgets = { projectDetectionMs: 250, configurationLoadMs: 100, templateCatalogMs: 100, providerCatalogMs: 100, bootstrapPreviewMs: 1000, bootstrapApplyMs: 3000, registryStatusMs: 500, stateReadMs: 50, warmCliStartupMs: 250, memoryRssMiB: 150 };
  const violations = Object.entries(budgets).filter(([name, budget]) => metrics[name] > budget).map(([name, budget]) => ({ name, actual: metrics[name], budget }));
  console.log(JSON.stringify({ metrics, budgets, violations, valid: violations.length === 0 }, null, 2));
  if (violations.length) process.exitCode = 1;
} finally { await rm(root, { recursive: true, force: true }); }
