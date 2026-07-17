import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { invokeRuntimePlugin, PluginRuntimeError, PluginRuntimeHost, runtimePermissionSupported, validateRuntimeManifest } from "../src/plugin-runtime.js";

const manifest = { schemaVersion: 2, type: "runtime", id: "example", version: "1.0.0", entry: "plugin.mjs", permissions: [], capabilities: ["ping"] };

test("runtime plugin executes through isolated JSON-RPC", { skip: !runtimePermissionSupported() }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-plugin-"));
  try {
    await writeFile(path.join(root, "plugin.mjs"), `let input="";process.stdin.on("data",c=>input+=c);process.stdin.on("end",()=>{const r=JSON.parse(input);console.log(JSON.stringify({jsonrpc:"2.0",id:r.id,result:{pong:true,secret:process.env.OPENAI_API_KEY??null}}));});`);
    const result = await invokeRuntimePlugin(root, manifest, "ping");
    assert.equal(result.result.pong, true);
    assert.equal(result.result.secret, null);
    assert.equal(result.secretEnvironmentPassed, false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("runtime plugin denies undeclared capabilities and unsafe entries", async () => {
  await assert.rejects(() => invokeRuntimePlugin(".", manifest, "write"), (error) => error instanceof PluginRuntimeError && error.code === "PLUGIN_CAPABILITY_DENIED");
  assert.throws(() => validateRuntimeManifest({ ...manifest, entry: "../escape.js" }, "."), (error) => error.code === "PLUGIN_ENTRY_INVALID");
});

test("runtime host starts, invokes, reloads, and stops persistent workers", { skip: !runtimePermissionSupported() }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-plugin-host-"));
  const host = new PluginRuntimeHost();
  try {
    await writeFile(path.join(root, "plugin.mjs"), `import readline from "node:readline";const lines=readline.createInterface({input:process.stdin});lines.on("line",line=>{const r=JSON.parse(line);console.log(JSON.stringify({jsonrpc:"2.0",id:r.id,result:{pong:r.params.value,secret:process.env.OPENAI_API_KEY??null}}));});`);
    assert.equal((await host.start(root, manifest)).running, true);
    const first = await host.invoke("example", "ping", { value: 1 });
    assert.deepEqual(first.result, { pong: 1, secret: null });
    assert.equal(first.secretEnvironmentPassed, false);
    assert.equal((await host.reload(root, manifest)).running, true);
    assert.equal((await host.invoke("example", "ping", { value: 2 })).result.pong, 2);
    assert.equal((await host.stop("example")).stopped, true);
    assert.equal(host.status("example").running, false);
  } finally { await host.stop("example"); await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("runtime permission support matches the Node platform matrix", () => {
  assert.equal(runtimePermissionSupported({ nodeVersion: "20.20.0", platform: "linux" }), true);
  assert.equal(runtimePermissionSupported({ nodeVersion: "20.20.0", platform: "darwin" }), false);
  assert.equal(runtimePermissionSupported({ nodeVersion: "20.20.0", platform: "win32" }), false);
  assert.equal(runtimePermissionSupported({ nodeVersion: "22.0.0", platform: "darwin" }), true);
  assert.equal(runtimePermissionSupported({ nodeVersion: "22.0.0", platform: "win32" }), true);
});
