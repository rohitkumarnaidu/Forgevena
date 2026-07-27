import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);
const cli = path.resolve("bin", "forgevena.js");

const readOnlyCommands = [
  ["status"],
  ["validate"],
  ["version"],
  ["state", "validate"],
  ["state", "history"],
  ["vault", "audit"],
  ["integrations", "list"],
  ["integrations", "status"],
  ["capabilities"],
  ["install"],
  ["reference"],
  ["credentials", "list"],
  ["credentials", "status"],
  ["credentials", "validate"],
  ["credentials", "backup"],
  ["providers", "list"],
  ["providers", "status"],
  ["mcp", "list"],
  ["plugins", "list"],
  ["cloud", "list"],
  ["templates"],
  ["templates", "catalogs"],
  ["org", "validate"],
  ["org", "audit"],
  ["org", "compliance"],
  ["diagnostics", "health"],
  ["diagnostics", "metrics"],
  ["diagnostics", "traces"],
  ["diagnostics", "profile"],
  ["supply-chain", "verify"],
  ["supply-chain", "scan"],
  ["supply-chain", "artifacts"],
  ["skills", "list"],
  ["index", "status"],
  ["semantic", "status"],
  ["semantic", "plan"],
  ["config"],
];

test("all public read-only CLI families return parseable contracts without mutation", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-command-matrix-"));
  try {
    for (const command of readOnlyCommands) {
      const { stdout } = await execute(process.execPath, [cli, ...command, "--structured"], { cwd: root, timeout: 15_000 });
      const result = JSON.parse(stdout);
      assert.equal(result.schemaVersion, 1, command.join(" "));
      assert.equal(result.status, "success", command.join(" "));
      assert.equal(result.diagnostics, undefined, command.join(" "));
    }
    assert.deepEqual(await rm(root, { recursive: true, force: true }), undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("CLI command families expose stable usage errors for invalid actions", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cli-command-errors-"));
  const commands = [
    ["state", "invalid"], ["vault", "invalid"], ["credentials", "invalid"],
    ["templates", "invalid"], ["org", "invalid"], ["diagnostics", "invalid"],
    ["supply-chain", "invalid"], ["skills", "invalid"], ["workflows", "invalid"],
    ["index", "invalid"], ["semantic", "invalid"], ["copilot", "invalid", "objective"],
    ["integrations", "invalid"], ["mcp", "invalid"], ["plugins", "invalid"],
    ["cloud", "invalid"], ["docker", "invalid"],
  ];
  try {
    for (const command of commands) {
      await assert.rejects(
        () => execute(process.execPath, [cli, ...command, "--structured"], { cwd: root, timeout: 15_000 }),
        (error) => {
          const result = JSON.parse(error.stderr);
          return result.status === "error" && Number.isInteger(error.code) && error.code > 0;
        },
        command.join(" "),
      );
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
