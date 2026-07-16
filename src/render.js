import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { readCredential } from "./credentials.js";

const executeFile = promisify(execFile);
const CLOUD_STATE = path.join(".ai-workspace", "cloud", "render.json");
const API_BASE = "https://api.render.com/v1";

export async function generateRenderBlueprint(root, { dryRun = true } = {}) {
  const workspace = await readWorkspace(root);
  const blueprint = blueprintFor(workspace.template, workspace.projectName ?? path.basename(root));
  const target = path.join(root, "render.yaml");
  const existing = await exists(target);
  const plan = { provider: "render", template: workspace.template, dryRun, create: existing ? [] : ["render.yaml"], skipped: existing ? ["render.yaml"] : [], blueprintGenerated: !existing };
  if (dryRun || existing) return plan;
  await writeFile(target, blueprint, "utf8");
  await updateRenderState(root, { template: workspace.template, blueprint: "render.yaml", blueprintGeneratedAt: new Date().toISOString() });
  return { ...plan, dryRun: false };
}

export async function validateRenderBlueprint(root) {
  let content;
  try { content = await readFile(path.join(root, "render.yaml"), "utf8"); } catch { return { valid: false, issues: ["render.yaml is missing."] }; }
  const issues = [];
  if (!/^services:/m.test(content)) issues.push("Blueprint must declare services.");
  if (!/\n\s+- type: (web|worker|cron|pserv)/m.test(content)) issues.push("Blueprint does not declare a supported service type.");
  if (!/\n\s+plan: free/m.test(content)) issues.push("Every generated service must default to the free plan.");
  if (/(_KEY|_TOKEN|_SECRET):?\s+value:/i.test(content)) issues.push("Potential secret values must use sync: false.");
  if (/runtime: docker/m.test(content) && !(await exists(path.join(root, "Dockerfile"))) && !/dockerfilePath: \.\/(frontend|backend|services)\//m.test(content)) issues.push("Docker runtime requires a valid Dockerfile path.");
  const remote = await gitRemote(root);
  return { valid: issues.length === 0, issues, repository: remote, repositoryReady: Boolean(remote), blueprint: "render.yaml", deeplink: remote ? renderDeeplink(remote) : null };
}

export async function configureRender(root, { serviceIds = [], workspaceId = null, dryRun = true } = {}) {
  const normalizedIds = [...new Set(serviceIds.map(String).map((value) => value.trim()).filter(Boolean))];
  const plan = { provider: "render", dryRun, update: [CLOUD_STATE], serviceIds: normalizedIds, workspaceId, storesSecrets: false };
  if (dryRun) return plan;
  await updateRenderState(root, { serviceIds: normalizedIds, workspaceId, configuredAt: new Date().toISOString() });
  return { ...plan, dryRun: false };
}

export async function renderDeploymentPlan(root, action = "deploy") {
  const validation = await validateRenderBlueprint(root);
  const state = await readRenderState(root);
  const serviceIds = state.serviceIds ?? [];
  const executable = validation.valid && validation.repositoryReady && serviceIds.length > 0;
  return {
    provider: "render",
    action,
    command: executable ? `Render API ${action} for ${serviceIds.length} registered service(s)` : "Open the Render Blueprint dashboard and apply render.yaml",
    scope: "Render cloud account",
    dataImpact: action === "status" ? "Reads deployment status for registered Render services." : "Creates deployments for registered Render services using the Git-backed source already connected to Render.",
    affectedPaths: ["Render cloud services", CLOUD_STATE],
    rollback: "Use the recorded prior deploy in Render or redeploy a known-good Git revision; the workspace never deletes cloud services automatically.",
    validation,
    serviceIds,
    executable,
    manualRequired: !executable,
    deeplink: validation.deeplink,
  };
}

export async function executeRenderDeployment(root, plan, { fetchImpl = globalThis.fetch } = {}) {
  if (!plan.executable) return { ...plan, executed: false };
  const token = await renderToken(root);
  if (!token) throw new Error("Missing RENDER_API_KEY. Set it through an environment or approved development profile.");
  const deployments = [];
  for (const serviceId of plan.serviceIds) {
    const response = await renderRequest(fetchImpl, `${API_BASE}/services/${encodeURIComponent(serviceId)}/deploys`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ clearCache: "do_not_clear" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message ?? `Render deploy failed with HTTP ${response.status}.`);
    deployments.push({ serviceId, deployId: payload.id ?? payload.deploy?.id ?? null, status: payload.status ?? payload.deploy?.status ?? null });
  }
  await updateRenderState(root, { lastDeployment: { at: new Date().toISOString(), deployments } });
  return { provider: "render", executed: true, deployments };
}

export async function executeRenderStatus(root, plan, { fetchImpl = globalThis.fetch } = {}) {
  if (!plan.executable) return { ...plan, executed: false };
  const token = await renderToken(root);
  if (!token) throw new Error("Missing RENDER_API_KEY.");
  const services = [];
  for (const serviceId of plan.serviceIds) {
    const response = await renderRequest(fetchImpl, `${API_BASE}/services/${encodeURIComponent(serviceId)}/deploys?limit=1`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload?.message ?? `Render status failed with HTTP ${response.status}.`);
    const latest = Array.isArray(payload) ? payload[0] : payload;
    services.push({ serviceId, latestDeploy: latest ? { id: latest.id ?? null, status: latest.status ?? null, createdAt: latest.createdAt ?? null, finishedAt: latest.finishedAt ?? null } : null });
  }
  return { provider: "render", executed: true, services };
}

export async function renderRollbackPlan(root) {
  const state = await readRenderState(root);
  return { provider: "render", action: "rollback", supported: "plan-only", automaticDeletion: false, lastDeployment: state.lastDeployment ?? null, serviceIds: state.serviceIds ?? [], message: "Select a known-good Git revision or prior deploy in Render, then explicitly redeploy it. Cloud resources are never deleted automatically." };
}

function blueprintFor(template, projectName) {
  const name = slug(projectName);
  const secrets = "      - key: OPENAI_API_KEY\n        sync: false\n      - key: ANTHROPIC_API_KEY\n        sync: false\n      - key: GEMINI_API_KEY\n        sync: false\n      - key: OPENROUTER_API_KEY\n        sync: false";
  if (template === "react") return `services:\n  - type: web\n    name: ${name}\n    runtime: static\n    plan: free\n    buildCommand: npm install && npm run build\n    staticPublishPath: ./dist\n    routes:\n      - type: rewrite\n        source: /*\n        destination: /index.html\n`;
  if (template === "full-stack-ai") return `services:\n  - type: web\n    name: ${name}-frontend\n    runtime: docker\n    plan: free\n    dockerfilePath: ./frontend/Dockerfile\n    dockerContext: ./frontend\n    envVars:\n      - key: API_URL\n        fromService:\n          name: ${name}-backend\n          type: web\n          property: host\n  - type: web\n    name: ${name}-backend\n    runtime: docker\n    plan: free\n    dockerfilePath: ./backend/Dockerfile\n    dockerContext: ./backend\n    healthCheckPath: /health\n    envVars:\n${secrets}\n`;
  if (template === "microservices") return `services:\n  - type: web\n    name: ${name}-gateway\n    runtime: docker\n    plan: free\n    dockerfilePath: ./services/gateway/Dockerfile\n    dockerContext: ./services/gateway\n    healthCheckPath: /health\n`;
  if (["nextjs", "fastapi", "express", "rag", "flutter"].includes(template)) return `services:\n  - type: web\n    name: ${name}\n    runtime: docker\n    plan: free\n    dockerfilePath: ./Dockerfile\n    dockerContext: .\n    healthCheckPath: ${["fastapi", "express", "rag"].includes(template) ? "/health" : "/"}\n    envVars:\n${secrets}\n`;
  throw new Error(`Template ${template} does not define a long-running Render service. Choose react, nextjs, fastapi, express, rag, flutter, full-stack-ai, or microservices.`);
}

function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "ai-workspace-app"; }
function renderDeeplink(remote) { return `https://dashboard.render.com/blueprint/new?repo=${encodeURIComponent(toHttpsRemote(remote))}`; }
function toHttpsRemote(remote) { if (/^git@github\.com:/.test(remote)) return remote.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, ""); if (/^git@gitlab\.com:/.test(remote)) return remote.replace(/^git@gitlab\.com:/, "https://gitlab.com/").replace(/\.git$/, ""); if (/^git@bitbucket\.org:/.test(remote)) return remote.replace(/^git@bitbucket\.org:/, "https://bitbucket.org/").replace(/\.git$/, ""); return remote.replace(/\.git$/, ""); }
async function gitRemote(root) { try { const { stdout } = await executeFile("git", ["remote", "get-url", "origin"], { cwd: root, windowsHide: true, timeout: 5000 }); return stdout.trim() || null; } catch { return null; } }
async function readWorkspace(root) { try { return JSON.parse(await readFile(path.join(root, ".ai-workspace", "workspace.json"), "utf8")); } catch { throw new Error("Initialize the project before generating Render assets."); } }
async function readRenderState(root) { try { return { schemaVersion: 1, provider: "render", ...JSON.parse(await readFile(path.join(root, CLOUD_STATE), "utf8")) }; } catch { return { schemaVersion: 1, provider: "render", serviceIds: [] }; } }
async function updateRenderState(root, updates) { const target = path.join(root, CLOUD_STATE); const state = { ...(await readRenderState(root)), ...updates, updatedAt: new Date().toISOString() }; await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, `${JSON.stringify(state, null, 2)}\n`, "utf8"); }
async function renderToken(root) { return readCredential(root, "render"); }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function renderRequest(fetchImpl, url, options, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(30000) });
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
      lastError = new Error(`Render request failed with HTTP ${response.status}.`);
      if (attempt === retries) return response;
    } catch (error) { lastError = error; if (attempt === retries) throw new Error(`Render request failed: ${error.message}`); }
    await new Promise((resolve) => setTimeout(resolve, Math.min(250 * (2 ** attempt), 2000)));
  }
  throw lastError;
}
