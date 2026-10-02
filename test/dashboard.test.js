import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startDashboard } from "../src/dashboard.js";
import { initializeProject } from "../src/project.js";

function dashboardRequest(base, token, pathname, { method = "GET", body, headers = {} } = {}) {
  return fetch(`${base}${pathname}`, {
    method,
    headers: {
      "x-ai-workspace-session": token,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

test("dashboard is loopback-only and token protected", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  try {
    assert.equal(dashboard.host, "127.0.0.1");
    assert.equal((await fetch(`${base}/api/providers`)).status, 401);
    assert.equal((await fetch(`${base}/api/providers`, { headers: { "x-ai-workspace-session": `${dashboard.token}x` } })).status, 401);
    const response = await fetch(`${base}/api/providers`, { headers: { "x-ai-workspace-session": dashboard.token } });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.profiles.some((item) => item.name === "openai"));
    assert.doesNotMatch(JSON.stringify(payload), /API_KEY=/);
    const platformResponse = await fetch(`${base}/api/platform`, { headers: { "x-ai-workspace-session": dashboard.token } });
    assert.equal(platformResponse.status, 200);
    const platform = await platformResponse.json();
    assert.deepEqual(platform.mcpServers, []);
    assert.deepEqual(platform.plugins, []);
    const agentsResponse = await dashboardRequest(base, dashboard.token, "/api/agents");
    assert.equal(agentsResponse.status, 200);
    const agents = await agentsResponse.json();
    assert.ok(agents.agents.some((item) => item.id === "engineering-copilot"));
    assert.equal(agents.policy.humanPromotionRequired, true);
    assert.equal(agents.policy.sourceContentExcluded, true);
    const workflowsResponse = await dashboardRequest(base, dashboard.token, "/api/workflows");
    assert.equal(workflowsResponse.status, 200);
    const workflows = await workflowsResponse.json();
    assert.deepEqual(workflows.runs, []);
    assert.equal(workflows.policy.humanPromotionRequired, true);
    const cloudsResponse = await fetch(`${base}/api/clouds`, { headers: { "x-ai-workspace-session": dashboard.token } });
    assert.equal(cloudsResponse.status, 200);
    assert.equal((await cloudsResponse.json()).clouds.length, 7);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("dashboard credential endpoint never echoes a secret", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-key-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  try {
    const response = await fetch(`${base}/api/providers/credential`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-ai-workspace-session": dashboard.token },
      body: JSON.stringify({ provider: "openai", secret: "dashboard-secret" }),
    });
    const payload = await response.json();
    assert.equal(payload.configured, true);
    assert.doesNotMatch(JSON.stringify(payload), /dashboard-secret/);
    assert.match(await readFile(path.join(root, ".ai-workspace", "local-secrets", "openai.env"), "utf8"), /^OPENAI_API_KEY=dashboard-secret$/m);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("dashboard manages named credential slots without returning secret values", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-slots-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  const post = (pathname, body) => dashboardRequest(base, dashboard.token, pathname, { method: "POST", body });
  try {
    const primary = await post("/api/providers/credential", { provider: "gemini", keyId: "primary", secret: "primary-dashboard-secret" });
    assert.equal((await primary.json()).configured, true);
    const created = await post("/api/providers/credential", { provider: "gemini", keyId: "personal", secret: "personal-dashboard-secret" });
    assert.equal((await created.json()).configured, true);
    const activated = await post("/api/providers/credential/activate", { provider: "gemini", keyId: "personal" });
    assert.equal((await activated.json()).activated, true);
    const model = await post("/api/providers/model", { provider: "gemini", model: "gemini-2.5-flash" });
    assert.equal((await model.json()).model, "gemini-2.5-flash");
    const rotated = await post("/api/providers/credential/rotate", { provider: "gemini", keyId: "personal", secret: "rotated-dashboard-secret" });
    assert.equal((await rotated.json()).rotated, true);
    const quarantined = await post("/api/providers/credential/remove", { provider: "gemini", keyId: "personal", nextKeyId: "primary" });
    assert.equal((await quarantined.json()).removed, true);
    const recovered = await post("/api/providers/credential/recover", { provider: "gemini", keyId: "personal" });
    assert.equal((await recovered.json()).recovered, true);
    const payload = await (await dashboardRequest(base, dashboard.token, "/api/providers")).json();
    const slots = payload.credentials.gemini.keys;
    assert.equal(slots.find((entry) => entry.keyId === "primary").active, true);
    assert.equal(slots.find((entry) => entry.keyId === "personal").status, "active");
    assert.equal(payload.profiles.find((entry) => entry.name === "gemini").defaultModel, "gemini-2.5-flash");
    assert.deepEqual(payload.testHistory.records, []);
    assert.doesNotMatch(JSON.stringify(payload), /primary-dashboard-secret|personal-dashboard-secret|rotated-dashboard-secret/);
    const source = await (await fetch(`${base}/dashboard-ui.js`)).text();
    assert.match(source, /Add or rotate key/);
    assert.match(source, /Quarantine/);
    assert.match(source, /Save model/);
    assert.match(source, /Recent consented tests/);
    assert.doesNotMatch(source, /prompt\("Choose the replacement/);
    assert.match(source, /forgevena-dashboard-theme/);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("dashboard serves HTML with security headers and rejects unauthorized origins", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-security-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const pageHtml = await page.text();
    assert.match(pageHtml, /Forgevena Command Center/);
    assert.match(pageHtml, /<script src="\/dashboard-ui\.js"><\/script>/);
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    assert.equal(page.headers.get("cache-control"), "no-store");
    assert.match(page.headers.get("content-security-policy"), /script-src 'self'/);
    assert.equal((await fetch(`${base}/favicon.ico`)).status, 204);

    const script = await fetch(`${base}/dashboard-ui.js`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get("content-type"), /application\/javascript/);
    const source = await script.text();
    assert.match(source, /Provider workspace/);
    assert.match(source, /confirmDataEgress: true/);
    assert.match(source, /forgevena-dashboard-theme/);
    assert.match(source, /Use dark mode/);
    assert.match(source, /Compatibility evidence/);
    assert.match(source, /Agent command center/);
    assert.match(source, /Runs and workflows/);
    assert.match(source, /agent\.execution/);
    const agents = await (await dashboardRequest(base, dashboard.token, "/api/agents")).json();
    assert.equal(agents.agents.find((agent) => agent.id === "engineering-copilot")?.execution, "plan-only-by-default");
    assert.doesNotMatch(source, /api\/workflows\/run/);
    assert.match(source, /scrollIntoView/);
    assert.doesNotMatch(source, /AI Workspace Settings/);
    assert.doesNotMatch(source, /Test response:/);

    const crossOrigin = await dashboardRequest(base, dashboard.token, "/api/providers", {
      headers: { origin: "https://example.invalid" },
    });
    assert.equal(crossOrigin.status, 401);
    assert.deepEqual(await crossOrigin.json(), { error: "unauthorized" });

    const sameOrigin = await dashboardRequest(base, dashboard.token, "/api/providers", {
      headers: { origin: base },
    });
    assert.equal(sameOrigin.status, 200);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("dashboard validates methods and JSON request bodies", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-json-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  try {
    assert.equal((await dashboardRequest(base, dashboard.token, "/missing")).status, 404);

    const wrongType = await dashboardRequest(base, dashboard.token, "/api/providers/profile", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "text/plain" },
    });
    assert.equal(wrongType.status, 400);
    assert.match((await wrongType.json()).message, /Content-Type/);

    const malformed = await dashboardRequest(base, dashboard.token, "/api/providers/profile", {
      method: "POST",
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error, "request_failed");

    const oversized = await dashboardRequest(base, dashboard.token, "/api/providers/profile", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(70 * 1024) }),
    });
    assert.equal(oversized.status, 400);
    assert.match((await oversized.json()).message, /64 KiB/);

    const unknownPost = await dashboardRequest(base, dashboard.token, "/api/unknown", {
      method: "POST",
      body: {},
    });
    assert.equal(unknownPost.status, 404);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("dashboard supports additive local configuration and enforces external consent", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "provider-dashboard-actions-"));
  const dashboard = await startDashboard(root);
  const base = `http://${dashboard.host}:${dashboard.port}`;
  const post = (pathname, body) => dashboardRequest(base, dashboard.token, pathname, { method: "POST", body });
  try {
    await initializeProject(root, { dryRun: false, createProject: true, projectName: "Dashboard Demo", template: "fastapi" });
    assert.equal((await post("/api/providers/profile", { provider: "openai" })).status, 200);
    assert.equal((await post("/api/providers/policy", { provider: "openai", policy: { mode: "guarded" } })).status, 200);
    assert.equal((await post("/api/mcp/register", { name: "local-docs", transport: "stdio", command: "node", args: ["server.js"] })).status, 200);

    const mcpConsent = await post("/api/mcp/activation", { name: "local-docs", enabled: true, host: "codex" });
    assert.equal(mcpConsent.status, 400);
    assert.equal((await mcpConsent.json()).error, "consent_required");

    const providerConsent = await post("/api/providers/test", { provider: "openai" });
    assert.equal(providerConsent.status, 400);
    assert.equal((await providerConsent.json()).error, "consent_required");

    const deployConsent = await post("/api/render/deploy", {});
    assert.equal(deployConsent.status, 400);
    assert.equal((await deployConsent.json()).error, "consent_required");

    assert.equal((await post("/api/render/generate", {})).status, 200);
    assert.equal((await post("/api/render/configure", { serviceIds: ["srv-1"], workspaceId: "wrk-1" })).status, 200);
    assert.equal((await post("/api/render/credential", { secret: "render-secret" })).status, 200);
    assert.equal((await post("/api/clouds/credential", { cloud: "railway", secret: "railway-secret", storage: "local" })).status, 200);
  } finally {
    await dashboard.close();
    await rm(root, { recursive: true, force: true });
  }
});
