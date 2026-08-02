import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relative) {
  return readFile(path.join(root, relative), "utf8");
}

test("v1.3 release records reflect immutable publication evidence", async () => {
  const checklist = await read("docs/release/V1_3_RELEASE_CHECKLIST.md");
  const status = await read("docs/release/V1_3_IMPLEMENTATION_STATUS.md");
  assert.doesNotMatch(checklist, /^- \[ \]/m);
  assert.match(checklist, /30292317567/);
  assert.match(checklist, /004710388afa7f2888a0e2594ede2d3cde96fe1c/);
  assert.match(status, /There are no remaining software-controlled or publication tasks/);
});

test("completion matrix preserves historical failures and separates v1.4 implementation from release", async () => {
  const matrix = await read("docs/release/V1_0_TO_V1_4_COMPLETION_MATRIX.md");
  const status = await read("docs/release/V1_4_IMPLEMENTATION_STATUS.md");
  const checklist = await read("docs/release/V1_4_RELEASE_CHECKLIST.md");
  assert.match(matrix, /v1\.2\.0.*failed publication/);
  assert.match(matrix, /v1\.2\.2.*failed publication/);
  assert.match(matrix, /v1\.4\.0.*Release HOLD/);
  assert.match(status, /implementation preview.*not a stable release/);
  assert.match(checklist, /\[ \] Credential-gated and consent-gated OpenAI smoke test passes/);
  assert.match(checklist, /\[x\] ProviderAdapter v1/);
});
