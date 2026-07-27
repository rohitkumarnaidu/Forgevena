import assert from "node:assert/strict";
import test from "node:test";
import { CommandRouter } from "../src/cli/router.js";
import { createApplicationContext } from "../src/cli/context.js";

test("command router dispatches registered handlers", async () => {
  const router = new CommandRouter({ handlers: { status: ({ value }) => ({ value }) } });
  assert.deepEqual(await router.dispatch("status", { value: 42 }), { value: 42 });
  assert.deepEqual(router.commands(), ["status"]);
});

test("command router rejects duplicate registrations", () => {
  const router = new CommandRouter({ handlers: { status: () => null } });
  assert.throws(() => router.register("status", () => null), (error) => error.code === "CLI_COMMAND_DUPLICATE");
});

test("command router validates and chains new registrations", async () => {
  const router = new CommandRouter();
  assert.equal(router.register("doctor", ({ healthy }) => healthy), router);
  assert.equal(await router.dispatch("doctor", { healthy: true }), true);
  assert.throws(() => router.register("", () => null), (error) => error.code === "CLI_HANDLER_INVALID");
  assert.throws(() => router.register("invalid", null), (error) => error.code === "CLI_HANDLER_INVALID");
});

test("command router returns stable unknown-command errors", async () => {
  const router = new CommandRouter();
  await assert.rejects(() => router.dispatch("missing", {}), (error) => error.code === "CLI_COMMAND_UNKNOWN" && error.exitCode === 2 && error.details.command === "missing");
  await assert.rejects(() => router.dispatch(undefined, {}), (error) => error.code === "CLI_COMMAND_UNKNOWN" && error.message.includes("<none>") && error.details.command === null);
});

test("command router supports explicit fallback behavior", async () => {
  const router = new CommandRouter({ fallback: ({ command }) => `help:${command}` });
  assert.equal(await router.dispatch("missing", { command: "missing" }), "help:missing");
});

test("application context freezes injected platform services", () => {
  const context = createApplicationContext("workspace", { services: { registry: { status: () => true } }, marker: "test" });
  assert.equal(context.root, "workspace");
  assert.equal(context.marker, "test");
  assert.equal(context.services.registry.status(), true);
  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(context.services), true);
  assert.throws(() => createApplicationContext("workspace", { services: [] }), /services must be an object/);
});
