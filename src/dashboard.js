import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createProviderService } from "./provider-service.js";
import { readProviderPolicy, setProviderPolicy } from "./provider-policy.js";
import { listMcpServers, registerMcpServer, setMcpActivation } from "./mcp.js";
import { listPlugins, setPluginEnabled } from "./plugins.js";
import { configureRender, executeRenderDeployment, generateRenderBlueprint, renderDeploymentPlan, validateRenderBlueprint } from "./render.js";
import { activateCredentialKey, configureCredential, credentialKeyAudit, credentialStatus, listCredentialKeys, recoverCredential, removeCredential, rotateCredential, validateCredential } from "./credentials.js";
import { inspectEcosystem } from "./ecosystem-health.js";
import { listCloudPlatforms, validateCloudPlatform } from "./clouds.js";
import { DASHBOARD_UI_SCRIPT } from "./dashboard-ui.js";
import { providerTestHistory, recordProviderTest } from "./provider-test-history.js";
import { engineeringCopilotPlan } from "./engineering-copilot.js";
import { projectIndexStatus } from "./project-index.js";
import { loadWorkflow, planWorkflow } from "./workflow-engine.js";

const HOST = "127.0.0.1";
const MAX_BODY_BYTES = 64 * 1024;

export async function startDashboard(root, { port = 0 } = {}) {
  const token = randomBytes(32).toString("base64url");
  const providerService = createProviderService(root);
  const server = http.createServer((request, response) => handleRequest(root, token, providerService, request, response));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });
  const address = server.address();
  const result = {
    host: HOST,
    port: address.port,
    url: `http://${HOST}:${address.port}/#token=${token}`,
    security: "Loopback-only server with an in-memory session token. Secrets are never returned.",
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
  Object.defineProperty(result, "token", { value: token, enumerable: false });
  return result;
}

async function handleRequest(root, token, providerService, request, response) {
  securityHeaders(response);
  try {
    const url = new URL(request.url, `http://${HOST}`);
    if (request.method === "GET" && url.pathname === "/") return html(response, dashboardShell());
    if (request.method === "GET" && url.pathname === "/dashboard-ui.js") return javascript(response, DASHBOARD_UI_SCRIPT);
    if (request.method === "GET" && url.pathname === "/favicon.ico") return empty(response, 204);
    if (!authorized(request, token)) return json(response, 401, { error: "unauthorized" });
    if (request.method === "GET" && url.pathname === "/api/providers") {
      const persisted = await providerService.registry.read();
      const profiles = providerService.list().map((profile) => ({ ...profile, ...(persisted.profiles[profile.name] ?? {}) }));
      const status = await providerService.status();
      const policies = Object.fromEntries(await Promise.all(profiles.map(async ({ name }) => [name, await readProviderPolicy(root, name)])));
      const credentials = Object.fromEntries(await Promise.all(profiles.map(async ({ name }) => [name, await credentialDashboardSummary(root, name)])));
      const models = Object.fromEntries(status.map((entry) => [entry.provider, Array.isArray(entry.models) ? entry.models : []]));
      return json(response, 200, { profiles, status, policies, credentials, models, testHistory: await providerTestHistory(root), compatibility: await Promise.all(profiles.map(async ({ name }) => [name, await providerService.registry.compatibility(name)])) });
    }
    if (request.method === "GET" && url.pathname === "/api/agents") return json(response, 200, await dashboardAgents(root, providerService));
    if (request.method === "GET" && url.pathname === "/api/workflows") return json(response, 200, await dashboardWorkflows(root));
    if (request.method === "GET" && url.pathname === "/api/platform") return json(response, 200, { mcpServers: await listMcpServers(root), plugins: await listPlugins(root), render: { ...(await validateRenderBlueprint(root)), credential: await credentialStatus(root, "render") }, ecosystem: await inspectEcosystem(root) });
    if (request.method === "GET" && url.pathname === "/api/clouds") return json(response, 200, { clouds: await Promise.all(listCloudPlatforms().map(({ name }) => validateCloudPlatform(root, name))) });
    if (request.method !== "POST") return json(response, 404, { error: "not_found" });
    const body = await readJson(request);
    if (url.pathname === "/api/providers/profile") return json(response, 200, await providerService.initialize(body.provider, { dryRun: false }));
    if (url.pathname === "/api/providers/credential") return json(response, 200, await configureCredential(root, body.provider, body.secret, { dryRun: false, keyId: body.keyId ?? "primary", storage: body.storage ?? "local" }));
    if (url.pathname === "/api/providers/credential/activate") return json(response, 200, await activateCredentialKey(root, body.provider, body.keyId, { dryRun: false }));
    if (url.pathname === "/api/providers/credential/rotate") return json(response, 200, await rotateCredential(root, body.provider, body.secret, { dryRun: false, keyId: body.keyId ?? "primary", storage: body.storage ?? "local" }));
    if (url.pathname === "/api/providers/credential/remove") return json(response, 200, await removeCredential(root, body.provider, { dryRun: false, keyId: body.keyId ?? "primary", nextKeyId: body.nextKeyId ?? null }));
    if (url.pathname === "/api/providers/credential/recover") return json(response, 200, await recoverCredential(root, body.provider, { dryRun: false, keyId: body.keyId ?? "primary" }));
    if (url.pathname === "/api/providers/policy") return json(response, 200, await setProviderPolicy(root, body.provider, body.policy ?? {}, { dryRun: false }));
    if (url.pathname === "/api/providers/model") return json(response, 200, await providerService.configureModel(body.provider, body.model));
    if (url.pathname === "/api/providers/test") {
      if (body.confirmDataEgress !== true) return json(response, 400, { error: "consent_required", message: "Confirm external data transmission before testing a provider." });
      const result = await providerService.invoke(body.provider, { prompt: "Reply only with OK.", model: body.model, idempotency: "read-only" });
      const credentialValidation = await validateManagedCredential(root, body.provider);
      const history = await recordProviderTest(root, result);
      return json(response, 200, { schemaVersion: 1, operationId: result.operationId, status: "success", provider: result.provider, model: result.model, usage: history.usage, compatibilityEvidenceId: history.compatibilityEvidenceId, warnings: history.warningCodes, credentialValidation, secretValuesReturned: false, responseContentReturned: false });
    }
    if (url.pathname === "/api/agents/plan") return json(response, 200, await engineeringCopilotPlan(root, body.objective, { provider: body.provider, model: body.model }));
    if (url.pathname === "/api/workflows/plan") {
      const workflowPath = safeWorkspacePath(root, body.workflow);
      const workflow = await loadWorkflow(workflowPath);
      return json(response, 200, { ...planWorkflow(workflow), source: path.relative(root, workflowPath).replaceAll("\\", "/"), previewOnly: true });
    }
    if (url.pathname === "/api/mcp/register") return json(response, 200, await registerMcpServer(root, body, { dryRun: false }));
    if (url.pathname === "/api/mcp/activation") {
      if (body.confirmActivation !== true) return json(response, 400, { error: "consent_required", message: "Confirm MCP activation." });
      return json(response, 200, await setMcpActivation(root, body.name, body.enabled === true, body.host, { dryRun: false }));
    }
    if (url.pathname === "/api/plugins/activation") return json(response, 200, await setPluginEnabled(root, body.id, body.enabled === true, { dryRun: false }));
    if (url.pathname === "/api/render/generate") return json(response, 200, await generateRenderBlueprint(root, { dryRun: false }));
    if (url.pathname === "/api/render/configure") return json(response, 200, await configureRender(root, { serviceIds: body.serviceIds ?? [], workspaceId: body.workspaceId ?? null, dryRun: false }));
    if (url.pathname === "/api/render/credential") return json(response, 200, await configureCredential(root, "render", body.secret, { dryRun: false }));
    if (url.pathname === "/api/clouds/credential") return json(response, 200, await configureCredential(root, body.cloud, body.secret, { dryRun: false, storage: body.storage ?? "local" }));
    if (url.pathname === "/api/render/deploy") {
      if (body.confirmDeployment !== true) return json(response, 400, { error: "consent_required", message: "Confirm the Render deployment." });
      const plan = await renderDeploymentPlan(root, "deploy");
      return json(response, 200, await executeRenderDeployment(root, plan));
    }
    return json(response, 404, { error: "not_found" });
  } catch (error) {
    return json(response, 400, { error: error.code ?? "request_failed", message: error.message });
  }
}

function authorized(request, token) {
  const origin = request.headers.origin;
  if (origin && origin !== `http://${HOST}:${request.headers.host?.split(":").at(-1)}` && origin !== `http://${request.headers.host}`) return false;
  const supplied = request.headers["x-ai-workspace-session"];
  if (typeof supplied !== "string") return false;
  const expectedBuffer = Buffer.from(token);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function readJson(request) {
  if (!String(request.headers["content-type"] ?? "").startsWith("application/json")) throw new Error("Content-Type must be application/json.");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body exceeds 64 KiB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function securityHeaders(response) {
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("cross-origin-resource-policy", "same-origin");
}

function json(response, status, value) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(value)}\n`);
}

function html(response, value) {
  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(value);
}

async function dashboardAgents(root, providerService) {
  const profiles = providerService.list();
  const statuses = await providerService.status();
  const agents = statuses.filter((entry) => entry.runtime?.capabilities?.includes("agent-execute")).map((entry) => ({
    id: entry.provider,
    name: entry.provider,
    kind: "host-adapter",
    service: profiles.find((profile) => profile.name === entry.provider)?.service ?? entry.provider,
    status: entry.runtime?.executableAvailable ? "available" : "attention",
    capabilities: entry.runtime?.capabilities ?? [],
    authority: "host-managed",
    execution: "compatibility-only",
    sourceContentSent: false,
    mutationRequiresConsent: true,
  }));
  let index;
  try { index = await projectIndexStatus(root); } catch { index = { indexed: false }; }
  return {
    schemaVersion: 1,
    agents: [{ id: "engineering-copilot", name: "Engineering Copilot", kind: "read-only-planner", service: "Forgevena Core", status: index.indexed ? "ready" : "needs-index", capabilities: ["metadata-plan", "recommendations"], authority: "read-only", execution: "plan-only-by-default", sourceContentSent: false, mutationRequiresConsent: true }, ...agents],
    policy: { humanPromotionRequired: true, externalTransmissionRequiresConsent: true, sourceContentExcluded: true, unboundedLoops: false },
    index,
  };
}

async function dashboardWorkflows(root) {
  const runs = [];
  const runRoot = path.join(root, ".ai-workspace", "workflows", "runs");
  try {
    for (const entry of await readdir(runRoot, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      try {
        const value = JSON.parse(await readFile(path.join(runRoot, entry.name), "utf8"));
        if (value?.schemaVersion === 1 && value.runId && value.workflow) runs.push({ runId: value.runId, workflow: value.workflow.id, version: value.workflow.version, status: value.status, cursor: value.cursor, totalNodes: value.workflow.order?.length ?? 0, updatedAt: value.updatedAt, resumable: !["completed", "failed"].includes(value.status) });
      } catch { continue; }
    }
  } catch (error) { if (error?.code !== "ENOENT") throw error; }
  return { schemaVersion: 1, runs: runs.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt))), policy: { deterministic: true, bounded: true, consentCheckpoints: true, humanPromotionRequired: true } };
}

function safeWorkspacePath(root, value) {
  const relative = String(value ?? "").trim();
  if (!relative || path.isAbsolute(relative) || relative.includes("..") || !relative.toLowerCase().endsWith(".json")) throw new Error("Workflow must be a relative JSON file inside the workspace.");
  return path.join(root, relative);
}

async function credentialDashboardSummary(root, provider) {
  try { return { status: await credentialStatus(root, provider), keys: await listCredentialKeys(root, provider), audit: await credentialKeyAudit(root, provider) }; }
  catch (error) {
    if (/Choose one of:/.test(error.message)) return { status: { credential: provider, configured: false, source: "host-managed" }, keys: [], audit: { schemaVersion: 1, audit: [], secretValuesReturned: false } };
    throw error;
  }
}

async function validateManagedCredential(root, provider) {
  try { return await validateCredential(root, provider, { dryRun: false }); }
  catch (error) {
    if (/Choose one of:/.test(error.message)) return { credential: provider, valid: true, source: "host-managed", recorded: false };
    throw error;
  }
}

function javascript(response, value) {
  response.statusCode = 200;
  response.setHeader("content-type", "application/javascript; charset=utf-8");
  response.end(value);
}

function empty(response, status) {
  response.statusCode = status;
  response.end();
}

function dashboardShell() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forgevena Command Center</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d241f;background:#eceee9;font-synthesis:none}*{box-sizing:border-box}body{margin:0;min-width:320px;background:linear-gradient(135deg,#edf0eb 0%,#e4e8e1 100%)}button,input,select{font:inherit}.console-shell{min-height:100vh;display:grid;grid-template-columns:238px minmax(0,1fr)}.sidebar{background:#18201d;color:#dbe5dd;padding:28px 18px;display:flex;flex-direction:column;gap:24px}.brand{font-size:12px;font-weight:800;letter-spacing:.18em;color:#bcff79}.sidebar-copy{margin:-16px 0 0;font-size:13px;color:#94a59b}.nav{display:grid;gap:6px}.nav-item{padding:10px 12px;border-radius:8px;font-size:14px;color:#aebbb2}.nav-item.active{background:#2a3730;color:#fff}.sidebar-foot{margin-top:auto;padding-top:16px;border-top:1px solid #35423a;font-size:12px;color:#9aa99f}.content{padding:clamp(24px,5vw,64px);max-width:1500px;width:100%;margin:0 auto}.topbar{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;border-bottom:1px solid #cfd5cc;padding-bottom:34px}.eyebrow{margin:0 0 12px;text-transform:uppercase;font-weight:800;letter-spacing:.12em;font-size:11px;color:#628645}.h1,h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(40px,6vw,74px);letter-spacing:-.055em;line-height:.92;margin:0;color:#1e2721}.lede{max-width:650px;font-size:17px;line-height:1.6;color:#59665e;margin:20px 0 0}.security-note{max-width:300px;padding:15px 16px;border-left:3px solid #8ac35c;background:#f7faf3;display:grid;gap:4px;font-size:13px;color:#546159}.security-note strong{color:#344c29}.notice{margin:22px 0 0;padding:14px 16px;border-radius:8px;font-size:14px}.notice-info{background:#edf3e9;color:#3f5930}.notice-success{background:#e3f4db;color:#245524}.notice-warning{background:#fff0ca;color:#6e4b00}.notice-danger{background:#f9e0dc;color:#7e2720}.section{padding-top:36px}.section-heading{display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-bottom:18px}.section h2{margin:0;color:#27342b;font-size:21px;letter-spacing:-.02em}.muted{margin:5px 0 0;color:#6a756d;font-size:13px;line-height:1.45}.provider-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.provider-card,.integration-card{background:rgba(255,255,252,.78);border:1px solid #d3dad1;border-radius:12px;padding:19px;box-shadow:0 10px 25px rgba(38,54,42,.05)}.provider-card{display:flex;flex-direction:column;gap:15px}.card-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.provider-title{display:flex;gap:10px;align-items:center}.provider-title h3,.integration-card h3{margin:0;font-size:16px;color:#1d2d22}.provider-mark{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:#e1ecd6;color:#3d6030;font-weight:800}.badge{display:inline-flex;white-space:nowrap;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700}.badge-good{background:#d9efd0;color:#326d2a}.badge-quiet{background:#edf0eb;color:#69746c}.capabilities{margin:0;color:#59675e;font-size:13px;line-height:1.45}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0}.fact{padding:9px;background:#f3f5f1;border-radius:7px}.fact dt{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#7a857d}.fact dd{margin:4px 0 0;font-size:12px;color:#38463d;overflow-wrap:anywhere}.controls{display:grid;gap:9px;margin-top:auto}.controls input,.controls select{min-height:38px;padding:8px 10px;border:1px solid #cbd5ca;border-radius:7px;background:#fff;color:#253229}.policy-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.button{min-height:38px;padding:8px 12px;border-radius:7px;border:1px solid transparent;cursor:pointer;font-weight:700;font-size:13px}.button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b6dc8f;outline-offset:2px}.button:disabled{opacity:.55;cursor:wait}.primary{background:#334c2b;color:#fff}.primary:hover{background:#263d20}.secondary{background:#eff3ec;color:#344a37;border-color:#ced7cc}.text{background:transparent;color:#4e733b;text-align:left;padding-left:0}.integration-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.integrations{padding-bottom:40px}.fatal{margin:10vh auto;max-width:640px;background:#fff1ef;color:#702820;padding:24px;border-radius:12px}@media(max-width:760px){.console-shell{grid-template-columns:1fr}.sidebar{padding:18px;gap:12px}.nav{grid-template-columns:repeat(4,1fr);overflow:auto}.nav-item{white-space:nowrap;text-align:center;font-size:12px}.sidebar-foot{display:none}.content{padding:26px 18px}.topbar{display:grid}.facts{grid-template-columns:1fr}.section-heading{display:grid}.security-note{max-width:none}}@media(prefers-reduced-motion:no-preference){.provider-card,.integration-card{transition:transform .18s ease,box-shadow .18s ease}.provider-card:hover,.integration-card:hover{transform:translateY(-2px);box-shadow:0 16px 28px rgba(38,54,42,.09)}}
</style></head><body><div id="app" aria-live="polite">Loading Forgevena Command Center…</div><script src="/dashboard-ui.js"></script></body></html>`;
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Workspace Provider Settings</title><style>
:root{color-scheme:light dark;font-family:Inter,system-ui,sans-serif}body{max-width:1100px;margin:0 auto;padding:32px;background:#0b1020;color:#eef2ff}h1{margin:0 0 8px}.sub{color:#a5b4fc;margin-bottom:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.card{background:#151d35;border:1px solid #334155;border-radius:14px;padding:18px}.badge{display:inline-block;border-radius:999px;background:#1e3a8a;padding:3px 9px;font-size:12px}label{display:block;margin-top:12px;color:#cbd5e1}input,select,button{box-sizing:border-box;width:100%;margin-top:5px;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff}button{cursor:pointer;background:#2563eb;border:0;font-weight:700}.secondary{background:#334155}.status{font-size:13px;color:#93c5fd;min-height:20px;margin-top:10px}.warning{border-left:4px solid #f59e0b;padding:12px;background:#292315;margin-bottom:20px}</style></head>
<body><h1>AI Workspace Settings</h1><p class="sub">Project-scoped providers, MCP servers, plugins, and Render readiness.</p><div class="warning">Keys remain local and are never displayed. External tests, MCP activation, and deployment require explicit confirmation.</div><div id="providers" class="grid"></div><h2>Platform integrations</h2><div id="platform" class="grid"></div>
<script>
const token=new URLSearchParams(location.hash.slice(1)).get('token');history.replaceState(null,'',location.pathname);const headers={'x-ai-workspace-session':token};
async function api(path,body){const options={headers:{...headers}};if(body){options.method='POST';options.headers['content-type']='application/json';options.body=JSON.stringify(body)}const response=await fetch(path,options);const data=await response.json();if(!response.ok)throw new Error(data.message||data.error);return data}
function escapeHtml(value){return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
async function load(){const data=await api('/api/providers');const compatibility=Object.fromEntries(data.compatibility);document.querySelector('#providers').innerHTML=data.profiles.map(profile=>{const status=data.status.find(item=>item.provider===profile.name);const policy=data.policies[profile.name];const evidence=compatibility[profile.name];return '<section class="card"><span class="badge">'+escapeHtml(profile.kind)+'</span><h2>'+escapeHtml(profile.name)+'</h2><p>'+escapeHtml(profile.capabilities.join(', '))+'</p><p>Credential: '+(status.credentialAvailable?'available':'not detected')+'</p><p>Compatibility: '+escapeHtml(evidence.freshness)+'</p><label>Development key<input id="key-'+profile.name+'" type="password" autocomplete="off"></label><button onclick="saveKey(\''+profile.name+'\')">Configure key</button><label>Policy<select id="mode-'+profile.name+'"><option '+(policy.mode==='guarded'?'selected':'')+'>guarded</option><option '+(policy.mode==='budgeted'?'selected':'')+'>budgeted</option><option '+(policy.mode==='unrestricted'?'selected':'')+'>unrestricted</option></select></label><button class="secondary" onclick="savePolicy(\''+profile.name+'\')">Save policy</button><button class="secondary" onclick="testProvider(\''+profile.name+'\')">Test provider</button><div class="status" id="status-'+profile.name+'"></div></section>'}).join('');await loadPlatform()}
async function loadPlatform(){const data=await api('/api/platform');document.querySelector('#platform').innerHTML='<section class="card"><h2>MCP servers</h2><p>'+data.mcpServers.length+' registered</p><label>Name<input id="mcp-name"></label><label>HTTPS URL<input id="mcp-url"></label><label>Authorization env<input id="mcp-env" placeholder="MCP_AUTH_HEADER"></label><button onclick="addMcp()">Register disabled server</button><div class="status" id="status-mcp"></div></section><section class="card"><h2>Plugins</h2><p>'+data.plugins.length+' declarative plugins registered</p><p>Install and integrity-check plugin manifests through the CLI; activation is available here after installation.</p></section><section class="card"><h2>Render</h2><p>Blueprint: '+(data.render.valid?'valid':'not ready')+'</p><p>Git repository: '+(data.render.repositoryReady?'ready':'not connected')+'</p><p>Credential: '+(data.render.credential.configured?'available':'not configured')+'</p><label>Render API key<input id="render-key" type="password" autocomplete="off"></label><button onclick="saveRenderKey()">Configure Render key</button><button class="secondary" onclick="generateRender()">Generate render.yaml</button><div class="status" id="status-render"></div></section>'}
async function run(name,work){const target=document.querySelector('#status-'+name);try{target.textContent='Working…';const value=await work();target.textContent=value}catch(error){target.textContent=error.message}}
function saveKey(name){run(name,async()=>{const field=document.querySelector('#key-'+name);await api('/api/providers/credential',{provider:name,secret:field.value});field.value='';return'Credential configured'})}
function savePolicy(name){run(name,async()=>{await api('/api/providers/policy',{provider:name,policy:{mode:document.querySelector('#mode-'+name).value}});return'Policy saved'})}
function testProvider(name){run(name,async()=>{if(!confirm('Send a fixed health prompt to '+name+'?'))return'Cancelled';await api('/api/providers/test',{provider:name,confirmDataEgress:true});return'Connection test completed. Response content was not retained.'})}
function addMcp(){const name=document.querySelector('#mcp-name').value;const url=document.querySelector('#mcp-url').value;const variable=document.querySelector('#mcp-env').value;run('mcp',async()=>{await api('/api/mcp/register',{name,transport:'http',url,headerEnvironment:variable?{Authorization:variable}:{}});await loadPlatform();return'Registered disabled MCP server'})}
function generateRender(){run('render',async()=>{await api('/api/render/generate',{});await loadPlatform();return'Render Blueprint generated or preserved'})}
function saveRenderKey(){run('render',async()=>{const field=document.querySelector('#render-key');await api('/api/render/credential',{secret:field.value});field.value='';return'Render credential configured'})}
async function loadHealth(){const data=await api('/api/platform');const health=data.ecosystem;const section=document.createElement('section');section.className='card';const title=document.createElement('h2');title.textContent='Ecosystem health';const summary=document.createElement('p');summary.textContent=health.counts.healthy+' healthy, '+health.counts.attention+' need attention, '+health.counts.total+' total checks';section.append(title,summary);for(const [name,items] of Object.entries(health.sections)){const row=document.createElement('p');row.textContent=name+': '+items.filter(item=>item.healthy).length+'/'+items.length+' healthy';section.append(row)}document.querySelector('#platform').before(section)}
load().then(loadHealth).catch(error=>document.body.textContent=error.message);
</script></body></html>`;
}
