import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("CLI help documents bootstrap options", async () => {
  const { stdout } = await promisify(execFile)("node", ["./bin/ai-workspace.js", "--help"]);
  assert.match(stdout, /create <name>/);
  assert.match(stdout, /integrations/);
});
