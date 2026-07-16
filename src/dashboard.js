import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { configureProviderCredential, initializeProviderProfile, listProviderProfiles, providerStatus } from "./providers.js";
import { invokeProvider } from "./provider-runtime.js";
import { readProviderPolicy, setProviderPolicy } from "./provider-policy.js";
import { listMcpServers, registerMcpServer, setMcpActivation } from "./mcp.js";
import { listPlugins, setPluginEnabled } from "./plugins.js";
import { configureRender, executeRenderDeployment, generateRenderBlueprint, renderDeploymentPlan, validateRenderBlueprint } from "./render.js";
import { configureCredential, credentialStatus } from "./credentials.js";
import { inspectEcosystem } from "./ecosystem-health.js";
import { listCloudPlatforms, validateCloudPlatform } from "./clouds.js";

const HOST = "127.0.0.1";
const MAX_BODY_BYTES = 64 * 1024;

export async function startDashboard(root, { port = 0 } = {}) {
  const token = randomBytes(32).toString("base64url");
  const server = http.createServer((request, response) => handleRequest(root, token, request, response));
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

async function handleRequest(root, token, request, response) {
  securityHeaders(response);
  try {
    const url = new URL(request.url, `http://${HOST}`);
    if (request.method === "GET" && url.pathname === "/") return html(response, dashboardHtml());
    if (!authorized(request, token)) return json(response, 401, { error: "unauthorized" });
    if (request.method === "GET" && url.pathname === "/api/providers") {
      const profiles = listProviderProfiles();
      const status = await providerStatus(root);
      const policies = Object.fromEntries(await Promise.all(profiles.map(async ({ name }) => [name, await readProviderPolicy(root, name)])));
      return json(response, 200, { profiles, status, policies });
    }
    if (request.method === "GET" && url.pathname === "/api/platform") return json(response, 200, { mcpServers: await listMcpServers(root), plugins: await listPlugins(root), render: { ...(await validateRenderBlueprint(root)), credential: await credentialStatus(root, "render") }, ecosystem: await inspectEcosystem(root) });
    if (request.method === "GET" && url.pathname === "/api/clouds") return json(response, 200, { clouds: await Promise.all(listCloudPlatforms().map(({ name }) => validateCloudPlatform(root, name))) });
    if (request.method !== "POST") return json(response, 404, { error: "not_found" });
    const body = await readJson(request);
    if (url.pathname === "/api/providers/profile") return json(response, 200, await initializeProviderProfile(root, body.provider, { dryRun: false }));
    if (url.pathname === "/api/providers/credential") return json(response, 200, await configureProviderCredential(root, body.provider, body.secret, { dryRun: false }));
    if (url.pathname === "/api/providers/policy") return json(response, 200, await setProviderPolicy(root, body.provider, body.policy ?? {}, { dryRun: false }));
    if (url.pathname === "/api/providers/test") {
      if (body.confirmDataEgress !== true) return json(response, 400, { error: "consent_required", message: "Confirm external data transmission before testing a provider." });
      const result = await invokeProvider(root, body.provider, { prompt: "Reply only with OK.", model: body.model });
      return json(response, 200, { provider: result.provider, model: result.model, text: result.text, usage: result.usage });
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
  response.setHeader("content-security-policy", "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
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
async function load(){const data=await api('/api/providers');document.querySelector('#providers').innerHTML=data.profiles.map(profile=>{const status=data.status.find(item=>item.provider===profile.name);const policy=data.policies[profile.name];return '<section class="card"><span class="badge">'+escapeHtml(profile.kind)+'</span><h2>'+escapeHtml(profile.name)+'</h2><p>'+escapeHtml(profile.capabilities.join(', '))+'</p><p>Credential: '+(status.credentialAvailable?'available':'not detected')+'</p><label>Development key<input id="key-'+profile.name+'" type="password" autocomplete="off"></label><button onclick="saveKey(\''+profile.name+'\')">Configure key</button><label>Policy<select id="mode-'+profile.name+'"><option '+(policy.mode==='guarded'?'selected':'')+'>guarded</option><option '+(policy.mode==='budgeted'?'selected':'')+'>budgeted</option><option '+(policy.mode==='unrestricted'?'selected':'')+'>unrestricted</option></select></label><button class="secondary" onclick="savePolicy(\''+profile.name+'\')">Save policy</button><button class="secondary" onclick="testProvider(\''+profile.name+'\')">Test provider</button><div class="status" id="status-'+profile.name+'"></div></section>'}).join('');await loadPlatform()}
async function loadPlatform(){const data=await api('/api/platform');document.querySelector('#platform').innerHTML='<section class="card"><h2>MCP servers</h2><p>'+data.mcpServers.length+' registered</p><label>Name<input id="mcp-name"></label><label>HTTPS URL<input id="mcp-url"></label><label>Authorization env<input id="mcp-env" placeholder="MCP_AUTH_HEADER"></label><button onclick="addMcp()">Register disabled server</button><div class="status" id="status-mcp"></div></section><section class="card"><h2>Plugins</h2><p>'+data.plugins.length+' declarative plugins registered</p><p>Install and integrity-check plugin manifests through the CLI; activation is available here after installation.</p></section><section class="card"><h2>Render</h2><p>Blueprint: '+(data.render.valid?'valid':'not ready')+'</p><p>Git repository: '+(data.render.repositoryReady?'ready':'not connected')+'</p><p>Credential: '+(data.render.credential.configured?'available':'not configured')+'</p><label>Render API key<input id="render-key" type="password" autocomplete="off"></label><button onclick="saveRenderKey()">Configure Render key</button><button class="secondary" onclick="generateRender()">Generate render.yaml</button><div class="status" id="status-render"></div></section>'}
async function run(name,work){const target=document.querySelector('#status-'+name);try{target.textContent='Working…';const value=await work();target.textContent=value}catch(error){target.textContent=error.message}}
function saveKey(name){run(name,async()=>{const field=document.querySelector('#key-'+name);await api('/api/providers/credential',{provider:name,secret:field.value});field.value='';return'Credential configured'})}
function savePolicy(name){run(name,async()=>{await api('/api/providers/policy',{provider:name,policy:{mode:document.querySelector('#mode-'+name).value}});return'Policy saved'})}
function testProvider(name){run(name,async()=>{if(!confirm('Send a fixed health prompt to '+name+'?'))return'Cancelled';const result=await api('/api/providers/test',{provider:name,confirmDataEgress:true});return'Test response: '+result.text})}
function addMcp(){const name=document.querySelector('#mcp-name').value;const url=document.querySelector('#mcp-url').value;const variable=document.querySelector('#mcp-env').value;run('mcp',async()=>{await api('/api/mcp/register',{name,transport:'http',url,headerEnvironment:variable?{Authorization:variable}:{}});await loadPlatform();return'Registered disabled MCP server'})}
function generateRender(){run('render',async()=>{await api('/api/render/generate',{});await loadPlatform();return'Render Blueprint generated or preserved'})}
function saveRenderKey(){run('render',async()=>{const field=document.querySelector('#render-key');await api('/api/render/credential',{secret:field.value});field.value='';return'Render credential configured'})}
async function loadHealth(){const data=await api('/api/platform');const health=data.ecosystem;const section=document.createElement('section');section.className='card';const title=document.createElement('h2');title.textContent='Ecosystem health';const summary=document.createElement('p');summary.textContent=health.counts.healthy+' healthy, '+health.counts.attention+' need attention, '+health.counts.total+' total checks';section.append(title,summary);for(const [name,items] of Object.entries(health.sections)){const row=document.createElement('p');row.textContent=name+': '+items.filter(item=>item.healthy).length+'/'+items.length+' healthy';section.append(row)}document.querySelector('#platform').before(section)}
load().then(loadHealth).catch(error=>document.body.textContent=error.message);
</script></body></html>`;
}
