import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

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
  assert.match(stdout, /upgrade \[rollback\]/);
  assert.match(stdout, /0\.2\.0-rc\.1/);
});
