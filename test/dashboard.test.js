import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startDashboard } from "../src/dashboard.js";

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
