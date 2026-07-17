import assert from "node:assert/strict";
import test from "node:test";
import { CommandRouter } from "../src/cli/router.js";

test("command router dispatches registered handlers", async () => {
  const router = new CommandRouter({ handlers: { status: ({ value }) => ({ value }) } });
  assert.deepEqual(await router.dispatch("status", { value: 42 }), { value: 42 });
  assert.deepEqual(router.commands(), ["status"]);
});

test("command router rejects duplicate registrations", () => {
  const router = new CommandRouter({ handlers: { status: () => null } });
  assert.throws(() => router.register("status", () => null), (error) => error.code === "CLI_COMMAND_DUPLICATE");
});

test("command router returns stable unknown-command errors", async () => {
  const router = new CommandRouter();
  await assert.rejects(() => router.dispatch("missing", {}), (error) => error.code === "CLI_COMMAND_UNKNOWN" && error.exitCode === 2 && error.details.command === "missing");
});

test("command router supports explicit fallback behavior", async () => {
  const router = new CommandRouter({ fallback: ({ command }) => `help:${command}` });
  assert.equal(await router.dispatch("missing", { command: "missing" }), "help:missing");
});
