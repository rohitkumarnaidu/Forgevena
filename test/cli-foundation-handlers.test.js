import assert from "node:assert/strict";
import test from "node:test";
import { credentialCommand, stateCommand, vaultCommand } from "../src/cli/handlers/foundation.js";

const options = Object.freeze({ dryRun: true, apply: false, yes: false, nonInteractive: false });

test("state handler routes every lifecycle action through injected services", async () => {
  const calls = [];
  const services = Object.fromEntries(["stateStatus", "repairState", "snapshotState", "migrateState", "stateHistory"].map((name) => [name, async (...args) => { calls.push([name, ...args]); return name; }]));
  const context = { root: "workspace" };
  assert.equal(await stateCommand(context, [], options, services), "stateStatus");
  assert.equal(await stateCommand(context, ["repair"], options, services), "repairState");
  assert.equal(await stateCommand(context, ["snapshot"], options, services), "snapshotState");
  assert.equal(await stateCommand(context, ["migrate"], options, services), "migrateState");
  assert.equal(await stateCommand(context, ["history"], options, services), "stateHistory");
  assert.equal(calls.every((entry) => entry[1] === "workspace"), true);
  await assert.rejects(() => stateCommand(context, ["invalid"], options, services), (error) => error.code === "CLI_STATE_ACTION_INVALID" && error.exitCode === 2);
});

test("vault handler routes lifecycle operations and validates required subjects", async () => {
  const services = {
    initializeCredentialPlaceholders: async () => "initialized",
    auditCredentialVault: async () => "audited",
    recoverCredential: async (_root, name) => `recovered:${name}`,
    migrateLegacyCredential: async (_root, name) => `migrated:${name}`,
    listCredentialDefinitions: () => [],
    rotateCredential: async (_root, name) => ({ credential: name, manualRequired: true }),
  };
  assert.equal(await vaultCommand("root", ["initialize"], options, services), "initialized");
  assert.equal(await vaultCommand("root", [], options, services), "audited");
  assert.equal(await vaultCommand("root", ["recover", "openai"], options, services), "recovered:openai");
  assert.equal(await vaultCommand("root", ["migrate", "openai"], options, services), "migrated:openai");
  assert.equal((await vaultCommand("root", ["rotate", "openai"], options, services)).credential, "openai");
  await assert.rejects(() => vaultCommand("root", ["recover"], options, services), (error) => error.code === "CLI_VAULT_CREDENTIAL_REQUIRED");
  await assert.rejects(() => vaultCommand("root", ["migrate"], options, services), (error) => error.code === "CLI_VAULT_CREDENTIAL_REQUIRED");
  await assert.rejects(() => vaultCommand("root", ["invalid"], options, services), (error) => error.code === "CLI_VAULT_ACTION_INVALID");
});

test("credential handler covers list, status, validation, backup, and removal", async () => {
  const services = {
    listCredentialDefinitions: () => [{ name: "openai" }, { name: "render" }],
    credentialStatus: async (_root, name) => ({ credential: name, configured: name === "openai" }),
    initializeCredentialPlaceholders: async () => ({ initialized: true }),
    validateCredential: async (_root, name) => ({ credential: name, valid: name === "openai" }),
    backupCredentials: async () => ({ backedUp: ["openai"] }),
    removeCredential: async (_root, name) => ({ removed: name }),
  };
  assert.equal((await credentialCommand("root", [], options, services)).credentials.length, 2);
  assert.equal((await credentialCommand("root", ["init"], options, services)).initialized, true);
  assert.equal((await credentialCommand("root", ["status", "openai"], options, services)).configured, true);
  assert.equal((await credentialCommand("root", ["status"], options, services)).credentials.length, 2);
  assert.equal((await credentialCommand("root", ["validate", "openai"], options, services)).valid, true);
  assert.equal((await credentialCommand("root", ["validate"], options, services)).credentials.length, 2);
  assert.deepEqual((await credentialCommand("root", ["backup"], options, services)).backedUp, ["openai"]);
  assert.equal((await credentialCommand("root", ["remove", "render"], options, services)).removed, "render");
  await assert.rejects(() => credentialCommand("root", ["invalid"], options, services), (error) => error.code === "CLI_CREDENTIAL_ACTION_INVALID");
});

test("credential configuration preserves routed storage and masked input boundaries", async () => {
  const calls = [];
  const services = {
    listCredentialDefinitions: () => [],
    configureCredential: async (...args) => {
      calls.push(args);
      return args[3].dryRun ? { environmentVariable: "OPENAI_API_KEY", storage: args[3].storage } : { configured: true, storage: args[3].storage };
    },
    promptSecret: async () => "masked-value",
  };
  const preview = await credentialCommand("root", ["configure", "openai", "--storage", "encrypted"], options, services);
  assert.equal(preview.storage, "encrypted");
  const applied = await credentialCommand("root", ["configure", "openai", "--storage", "encrypted"], { ...options, dryRun: false, apply: true }, services);
  assert.equal(applied.storage, "encrypted");
  assert.equal(calls.at(-1)[2], "masked-value");
  await assert.rejects(() => credentialCommand("root", ["configure"], options, services), (error) => error.code === "CLI_CREDENTIAL_REQUIRED");
  await assert.rejects(() => credentialCommand("root", ["configure", "openai"], { ...options, dryRun: false, nonInteractive: true }, services), (error) => error.code === "CLI_CREDENTIAL_INTERACTIVE_REQUIRED");
});

test("credential rotation honors preview, manual ownership, and interactive safety", async () => {
  const calls = [];
  const services = {
    listCredentialDefinitions: () => [],
    rotateCredential: async (...args) => {
      calls.push(args);
      if (args[2] === undefined) return { manualRequired: false, storage: args[3].storage };
      return { rotated: true, storage: args[3].storage };
    },
    promptSecret: async () => "replacement",
  };
  assert.equal((await credentialCommand("root", ["rotate", "openai", "--storage", "encrypted"], options, services)).storage, "encrypted");
  await assert.rejects(() => credentialCommand("root", ["rotate", "openai"], { ...options, dryRun: false, nonInteractive: true }, services), (error) => error.code === "CLI_CREDENTIAL_INTERACTIVE_REQUIRED");
  const applied = await credentialCommand("root", ["rotate", "openai", "--storage", "encrypted"], { ...options, dryRun: false, apply: true }, services);
  assert.equal(applied.rotated, true);
  assert.equal(calls.at(-1)[2], "replacement");

  const manual = { ...services, rotateCredential: async () => ({ manualRequired: true }) };
  assert.equal((await credentialCommand("root", ["rotate", "openai"], { ...options, dryRun: false }, manual)).manualRequired, true);
});
