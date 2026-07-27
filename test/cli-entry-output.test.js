import assert from "node:assert/strict";
import test from "node:test";
import { executeCli } from "../src/cli/entry.js";
import { commandError, parseCsv, parseGlobalOptions, positionalText, stripGlobalOptions } from "../src/cli/options.js";
import { renderError, renderResult } from "../src/cli/output.js";

test("CLI entry returns stable success and failure exit codes", async () => {
  const errors = [];
  assert.equal(await executeCli(async () => undefined, [], { error: (value) => errors.push(value) }), 0);
  assert.equal(await executeCli(async () => { throw commandError("CLI_USAGE", "Bad usage", 2); }, [], { error: (value) => errors.push(value) }), 2);
  assert.equal(errors[0], "Error: Bad usage");
  assert.equal(await executeCli(async () => { throw new Error("Failure"); }, [], { error: (value) => errors.push(value) }), 1);
});

test("structured CLI failures redact nested secrets and preserve stable envelopes", async () => {
  const errors = [];
  const error = commandError("PROVIDER_FAILED", "token=super-secret-value", 3, {
    authorization: "Bearer x",
    nested: { apiKey: "sk-abcdefghijklmnop", safe: "visible" },
  });
  assert.equal(await executeCli(async () => { throw error; }, ["--structured"], { error: (value) => errors.push(value) }), 3);
  const output = JSON.parse(errors[0]);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.status, "error");
  assert.equal(output.error.code, "PROVIDER_FAILED");
  assert.doesNotMatch(errors[0], /super-secret-value|Bearer x|abcdefghijklmnop/);
  assert.equal(output.error.details.nested.safe, "visible");
});

test("result rendering remains backward compatible in human and structured modes", () => {
  assert.deepEqual(JSON.parse(renderResult({ value: 1 })), { value: 1 });
  const structured = JSON.parse(renderResult({ create: ["file"] }, { structured: true, dryRun: true }, { operationId: "operation" }));
  assert.equal(structured.operationId, "operation");
  assert.deepEqual(structured.changes, ["file"]);
  assert.equal(structured.status, "success");
  const renderedError = JSON.parse(renderError(new Error("failure"), { operationId: "failure-operation" }));
  assert.equal(renderedError.operationId, "failure-operation");
  assert.equal(renderedError.error.code, "UNEXPECTED_ERROR");
});

test("global option parsing separates execution controls from command arguments", () => {
  const args = ["credentials", "configure", "openai", "--storage", "encrypted", "--structured", "--merge", "skip", "--yes"];
  assert.deepEqual(stripGlobalOptions(args), ["credentials", "configure", "openai", "--storage", "encrypted"]);
  assert.deepEqual(parseGlobalOptions(args), { dryRun: false, apply: true, yes: true, force: false, nonInteractive: false, verbose: false, structured: true, mergePolicy: "skip", skip: [] });
  assert.throws(() => parseGlobalOptions(["--apply", "--dry-run"]), (error) => error.code === "CLI_OPTION_CONFLICT");
  assert.deepEqual(parseCsv("one, two,,"), ["one", "two"]);
  assert.equal(positionalText(["run", "review", "--provider", "openai", "project"], 1, ["--provider"]), "review project");
});
