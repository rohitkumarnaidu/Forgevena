import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { approveExternalAction } from "../src/consent.js";
import { promptSecret } from "../src/secret-prompt.js";

test("interactive external consent approves only an explicit y response", async () => {
  const output = ttyOutput();
  let closed = false;
  const approved = await approveExternalAction({ command: "safe-command" }, {
    dryRun: false,
    apply: true,
    input: { isTTY: true },
    output,
    promptFactory: () => ({ question: async () => " Y ", close: () => { closed = true; } }),
  });
  assert.equal(approved.approved, true);
  assert.equal(approved.reason, "interactive-confirmation");
  assert.equal(closed, true);

  await assert.rejects(() => approveExternalAction({ command: "safe-command" }, {
    dryRun: false,
    apply: true,
    input: { isTTY: true },
    output,
    promptFactory: () => ({ question: async () => "no", close: () => {} }),
  }), /cancelled/);
});

test("masked secret prompt handles editing and restores terminal state", async () => {
  const input = ttyInput();
  const output = ttyOutput();
  const pending = promptSecret("Secret: ", { input, output });
  input.emit("data", Buffer.from("ab\bcd\r"));
  assert.equal(await pending, "acd");
  assert.equal(input.raw, false);
  assert.equal(input.paused, true);
  assert.equal(output.contents, "Secret: **\b \b**\n");
});

test("masked secret prompt rejects cancellation and non-interactive streams", async () => {
  await assert.rejects(() => promptSecret("Secret: ", { input: { isTTY: false }, output: ttyOutput() }), /interactive terminal/);
  const input = ttyInput();
  const output = ttyOutput();
  const pending = promptSecret("Secret: ", { input, output });
  input.emit("data", Buffer.from("x\u0003"));
  await assert.rejects(() => pending, /cancelled/);
  assert.equal(input.raw, false);
  assert.equal(input.paused, true);
});

function ttyInput() {
  const input = new EventEmitter();
  input.isTTY = true;
  input.isRaw = false;
  input.raw = false;
  input.paused = true;
  input.setRawMode = (value) => { input.raw = value; };
  input.resume = () => { input.paused = false; };
  input.pause = () => { input.paused = true; };
  return input;
}

function ttyOutput() {
  return { isTTY: true, contents: "", write(value) { this.contents += value; } };
}
