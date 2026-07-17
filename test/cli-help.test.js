import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PLATFORM_VERSION } from "../src/version.js";

test("CLI help documents bootstrap options", async () => {
  const { stdout } = await promisify(execFile)("node", ["./bin/ai-workspace.js", "--help"]);
  assert.match(stdout, /create <name>/);
  assert.match(stdout, /integrations/);
  assert.match(stdout, /credentials <init\|list\|configure\|rotate\|validate\|status\|backup\|remove>/);
  assert.match(stdout, /providers <list\|init\|configure\|status\|doctor\|validate\|update\|remove\|models\|project\|mcp\|invoke/);
  assert.match(stdout, /test\|verify\|login/);
  assert.match(stdout, /mcp <list\|add\|validate\|health/);
  assert.match(stdout, /cloud render/);
  assert.match(stdout, /cloud <provider> <prepare\|validate\|verify\|deploy\|status/);
  assert.match(stdout, /plugins <list\|install\|update\|trust/);
  assert.match(stdout, /semantic <configure\|status\|plan\|build\|query>/);
  assert.match(stdout, /copilot <plan\|run>/);
  assert.match(stdout, /upgrade \[rollback\]/);
  assert.match(stdout, /state <validate\|repair\|snapshot\|migrate\|history>/);
  assert.match(stdout, /vault <initialize\|rotate\|recover\|audit>/);
  assert.match(stdout, /--structured/);
  assert.match(stdout, /templates/);
  assert.match(stdout, /Forgevena/);
  assert.match(stdout, /Governed engineering from idea to production\./);
  assert.match(stdout, new RegExp(PLATFORM_VERSION.replaceAll(".", "\\.")));
  assert.match(stdout, /ai-workspace remains supported/);
});

test("structured output exposes a stable operation envelope", async () => {
  const { stdout } = await promisify(execFile)("node", ["./bin/forgevena.js", "version", "--structured"]);
  const output = JSON.parse(stdout);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.status, "success");
  assert.match(output.operationId, /^[0-9a-f-]{36}$/);
  assert.equal(output.result.version, PLATFORM_VERSION);
});

test("preferred and legacy CLI aliases expose the same version contract", async () => {
  const execute = promisify(execFile);
  const [preferred, legacy] = await Promise.all([
    execute("node", ["./bin/forgevena.js", "version"]),
    execute("node", ["./bin/ai-workspace.js", "version"]),
  ]);
  assert.deepEqual(JSON.parse(preferred.stdout), JSON.parse(legacy.stdout));
});
