import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { backupCredentials, configureCredential, credentialStatus, initializeCredentialPlaceholders, readCredential, removeCredential, rotateCredential, validateCredential } from "../src/credentials.js";

test("credential placeholders contain names but no values", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-placeholders-"));
  try {
    await initializeCredentialPlaceholders(root, { dryRun: false });
    const example = await readFile(path.join(root, ".env.example"), "utf8");
    assert.match(example, /^OPENAI_API_KEY=$/m);
    assert.match(example, /^RENDER_API_KEY=$/m);
    assert.equal((await initializeCredentialPlaceholders(root, { dryRun: false })).skipped[0], ".env.example");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("multiple credentials remain isolated and resolvable", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-isolation-"));
  try {
    await configureCredential(root, "openai", "openai-value", { dryRun: false });
    await configureCredential(root, "render", "render-value", { dryRun: false });
    assert.equal(await readCredential(root, "OPENAI_API_KEY"), "openai-value");
    assert.equal(await readCredential(root, "render"), "render-value");
    assert.equal((await credentialStatus(root, "render")).source, "workspace-local-secret");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("encrypted credentials rotate, validate, back up, and remove without deletion", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-lifecycle-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "test-only-master-key";
  try {
    await configureCredential(root, "openai", "first-value", { dryRun: false, storage: "encrypted" });
    assert.equal(await readCredential(root, "openai"), "first-value");
    assert.equal((await validateCredential(root, "openai")).valid, true);
    const rotated = await rotateCredential(root, "openai", "second-value", { dryRun: false, storage: "encrypted" });
    assert.equal(rotated.rotated, true);
    assert.equal(await readCredential(root, "openai"), "second-value");
    assert.deepEqual((await backupCredentials(root, { dryRun: false })).backedUp, ["openai"]);
    const removed = await removeCredential(root, "openai", { dryRun: false });
    assert.equal(removed.destructiveDelete, false);
    assert.equal((await credentialStatus(root, "openai")).configured, false);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});
