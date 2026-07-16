import test from "node:test";
import assert from "node:assert/strict";
import { BRAND } from "../src/brand.js";
import { versionInfo } from "../src/version.js";

test("brand contract preserves the 1.x compatibility boundary", () => {
  assert.equal(BRAND.name, "Forgevena");
  assert.equal(BRAND.caption, "Governed engineering from idea to production.");
  assert.equal(BRAND.executable, "forgevena");
  assert.equal(BRAND.legacyExecutable, "ai-workspace");
  assert.equal(BRAND.stateDirectory, ".ai-workspace");
});

test("version output exposes the public and compatibility identities", () => {
  const info = versionInfo();
  assert.equal(info.name, "Forgevena");
  assert.equal(info.executable, "forgevena");
  assert.equal(info.legacyExecutable, "ai-workspace");
  assert.equal(info.stateDirectory, ".ai-workspace");
});
