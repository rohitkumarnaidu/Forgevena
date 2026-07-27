import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { auditCredentialVault, backupCredentials, configureCredential, credentialStatus, initializeCredentialPlaceholders, migrateLegacyCredential, readCredential, recoverCredential, removeCredential, rotateCredential, validateCredential } from "../src/credentials.js";

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
    const initialPayload = JSON.parse(await readFile(path.join(root, ".credentials", "openai.enc.json"), "utf8"));
    assert.equal(initialPayload.schemaVersion, 2);
    assert.equal(initialPayload.kdf.name, "argon2id");
    assert.equal(initialPayload.salt.length > 20, true);
    assert.equal(initialPayload.variable, undefined);
    assert.equal(await readCredential(root, "openai"), "first-value");
    assert.equal((await validateCredential(root, "openai")).valid, true);
    const rotated = await rotateCredential(root, "openai", "second-value", { dryRun: false, storage: "encrypted" });
    assert.equal(rotated.rotated, true);
    assert.equal(await readCredential(root, "openai"), "second-value");
    const rotatedPayload = JSON.parse(await readFile(path.join(root, ".credentials", "openai.enc.json"), "utf8"));
    const protectedMetadata = JSON.parse(Buffer.from(rotatedPayload.protected, "base64").toString("utf8"));
    assert.equal(protectedMetadata.credentialVersion, 2);
    assert.deepEqual((await backupCredentials(root, { dryRun: false })).backedUp, ["openai"]);
    const removed = await removeCredential(root, "openai", { dryRun: false });
    assert.equal(removed.destructiveDelete, false);
    assert.equal((await credentialStatus(root, "openai")).configured, false);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("encrypted vault rejects ciphertext and metadata tampering", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-tamper-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "test-only-master-key";
  try {
    await configureCredential(root, "openai", "protected-value", { dryRun: false, storage: "encrypted" });
    const target = path.join(root, ".credentials", "openai.enc.json");
    const payload = JSON.parse(await readFile(target, "utf8"));
    payload.protected = Buffer.from(JSON.stringify({ variable: "render", credentialVersion: 1 })).toString("base64");
    await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`);
    await assert.rejects(() => readCredential(root, "openai"), /protected metadata|authenticate data/i);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("encrypted vault audits and recovers validated rotation history", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-recovery-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "test-only-master-key";
  try {
    await configureCredential(root, "openai", "first-value", { dryRun: false, storage: "encrypted" });
    await rotateCredential(root, "openai", "second-value", { dryRun: false, storage: "encrypted" });
    const audit = await auditCredentialVault(root);
    assert.equal(audit.healthy, true);
    assert.equal(audit.credentials[0].credentialVersion, 2);
    await removeCredential(root, "openai", { dryRun: false });
    const preview = await recoverCredential(root, "openai", { dryRun: true });
    assert.equal(preview.integrityValidated, true);
    assert.equal((await recoverCredential(root, "openai", { dryRun: false })).recovered, true);
    assert.equal(await readCredential(root, "openai"), "first-value");
    assert.equal((await recoverCredential(root, "openai", { dryRun: false })).skipped, true);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy encrypted credentials require explicit migration and become Argon2id vaults", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-legacy-migration-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "test-only-master-key";
  try {
    const target = path.join(root, ".credentials", "openai.enc.json");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify({ schemaVersion: 1, algorithm: "aes-256-gcm", variable: "OPENAI_API_KEY", iv: "AQEBAQEBAQEBAQEB", tag: "UAxJ0+38ls99Qmm7UTS6NA==", ciphertext: "RGKdbrGswjciK6iP" }, null, 2)}\n`);
    await assert.rejects(() => readCredential(root, "openai"), /explicit migration/i);
    const audit = await auditCredentialVault(root);
    assert.equal(audit.healthy, false);
    assert.equal(audit.credentials[0].migrationRequired, true);
    assert.equal((await migrateLegacyCredential(root, "openai", { dryRun: true })).requiresExplicitConsent, true);
    await assert.rejects(() => migrateLegacyCredential(root, "openai", { dryRun: false }), /--apply --yes/);
    const migrated = await migrateLegacyCredential(root, "openai", { dryRun: false, yes: true });
    assert.equal(migrated.migrated, true);
    assert.equal(await readCredential(root, "openai"), "legacy-value");
    const payload = JSON.parse(await readFile(target, "utf8"));
    assert.equal(payload.schemaVersion, 2);
    assert.equal(payload.kdf.name, "argon2id");
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("credential plans are additive and reject invalid configuration", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-plans-"));
  try {
    const placeholders = await initializeCredentialPlaceholders(root);
    assert.deepEqual(placeholders.create, [".env.example"]);
    assert.equal(placeholders.containsSecrets, false);

    const plan = await configureCredential(root, "openai", undefined, { storage: "encrypted" });
    assert.deepEqual(plan.create, [path.join(".credentials", "openai.enc.json")]);
    assert.equal(plan.secretHandling.includes("never logged"), true);
    await assert.rejects(() => configureCredential(root, "openai", "value", { dryRun: false, storage: "remote" }), /local or encrypted/);
    await assert.rejects(() => configureCredential(root, "openai", "", { dryRun: false }), /non-empty OPENAI_API_KEY/);
    await assert.rejects(() => configureCredential(root, "unknown", "value", { dryRun: false }), /Choose one of/);

    await configureCredential(root, "openai", "first", { dryRun: false });
    const existing = await configureCredential(root, "openai", "second", { dryRun: false });
    assert.equal(existing.configured, false);
    assert.equal(existing.manualRequired, true);
    assert.equal(await readCredential(root, "openai"), "first");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("credential resolution honors environment and legacy dotenv precedence", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-precedence-"));
  const previous = process.env.OPENAI_API_KEY;
  try {
    await writeFile(path.join(root, ".env"), "OPENAI_API_KEY=legacy-value\n", "utf8");
    assert.equal((await credentialStatus(root, "openai")).source, "legacy-dotenv");
    assert.equal(await readCredential(root, "openai"), "legacy-value");
    const externalRotation = await rotateCredential(root, "openai", "replacement", { dryRun: false });
    assert.equal(externalRotation.manualRequired, true);
    const externalRemoval = await removeCredential(root, "openai", { dryRun: false });
    assert.equal(externalRemoval.manualRequired, true);

    process.env.OPENAI_API_KEY = "process-value";
    assert.equal((await credentialStatus(root, "openai")).source, "process-environment");
    assert.equal(await readCredential(root, "openai"), "process-value");
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("credential validation, backup, removal, and recovery report safe empty states", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-empty-states-"));
  try {
    assert.equal((await validateCredential(root, "openai")).valid, false);
    assert.equal((await removeCredential(root, "openai")).removed, false);
    assert.equal((await recoverCredential(root, "openai")).recovered, false);
    assert.deepEqual((await backupCredentials(root)).credentials, []);

    await configureCredential(root, "openai", "value", { dryRun: false });
    const removalPlan = await removeCredential(root, "openai");
    assert.equal(removalPlan.destructiveDelete, false);
    assert.equal(removalPlan.move.from, path.join(".ai-workspace", "local-secrets", "openai.env"));
    const backupPlan = await backupCredentials(root);
    assert.deepEqual(backupPlan.credentials, [{ credential: "openai", source: "workspace-local-secret" }]);
    assert.equal(backupPlan.containsSecrets, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("encrypted vault requires a key and reports malformed or unsupported payloads", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-invalid-vault-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  try {
    delete process.env.AI_WORKSPACE_CREDENTIAL_KEY;
    await assert.rejects(() => configureCredential(root, "openai", "value", { dryRun: false, storage: "encrypted" }), /AI_WORKSPACE_CREDENTIAL_KEY/);

    const target = path.join(root, ".credentials", "openai.enc.json");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "not-json", "utf8");
    assert.equal((await validateCredential(root, "openai")).valid, false);
    assert.equal((await auditCredentialVault(root)).healthy, false);

    await writeFile(target, `${JSON.stringify({ schemaVersion: 2, algorithm: "wrong" })}\n`, "utf8");
    await assert.rejects(() => readCredential(root, "openai"), /metadata is invalid/);
    await writeFile(target, `${JSON.stringify({ schemaVersion: 99, algorithm: "aes-256-gcm" })}\n`, "utf8");
    await assert.rejects(() => readCredential(root, "openai"), /Unsupported credential vault schema/);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("PBKDF2 vaults remain readable and wrong passphrases fail closed", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-pbkdf2-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "correct-passphrase";
  try {
    await configureCredential(root, "openai", "protected-value", { dryRun: false, storage: "encrypted" });
    const target = path.join(root, ".credentials", "openai.enc.json");
    const payload = JSON.parse(await readFile(target, "utf8"));
    const { pbkdf2Sync, createCipheriv, randomBytes } = await import("node:crypto");
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const protectedMetadata = Buffer.from(JSON.stringify({ variable: "OPENAI_API_KEY", credentialVersion: 4 }), "utf8");
    const key = pbkdf2Sync("correct-passphrase", salt, 10_000, 32, "sha256");
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(protectedMetadata);
    const ciphertext = Buffer.concat([cipher.update("pbkdf2-value", "utf8"), cipher.final()]);
    await writeFile(target, `${JSON.stringify({ ...payload, kdf: { name: "pbkdf2-sha256", iterations: 10_000, outputLength: 32 }, salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), protected: protectedMetadata.toString("base64"), ciphertext: ciphertext.toString("base64") }, null, 2)}\n`);
    assert.equal(await readCredential(root, "openai"), "pbkdf2-value");
    assert.equal((await auditCredentialVault(root)).credentials[0].kdf, "pbkdf2-sha256");

    process.env.AI_WORKSPACE_CREDENTIAL_KEY = "wrong-passphrase";
    await assert.rejects(() => readCredential(root, "openai"));
    assert.equal((await validateCredential(root, "openai")).valid, false);
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("rotation keeps bounded encrypted history and rejects empty replacements", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-history-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "history-passphrase";
  try {
    await configureCredential(root, "openai", "value-0", { dryRun: false, storage: "encrypted" });
    assert.equal((await rotateCredential(root, "openai", "value-1", { storage: "encrypted" })).dryRun, true);
    await assert.rejects(() => rotateCredential(root, "openai", "", { dryRun: false, storage: "encrypted" }), /non-empty replacement/);
    for (let index = 1; index <= 7; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2));
      await rotateCredential(root, "openai", `value-${index}`, { dryRun: false, storage: "encrypted" });
    }
    const archives = (await readdir(path.join(root, ".credentials", "archive"))).filter((entry) => entry.startsWith("openai-"));
    assert.equal(archives.length, 5);
    assert.equal(await readCredential(root, "openai"), "value-7");
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("vault migration and recovery skip current, missing, and unsafe candidates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-migration-states-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "migration-passphrase";
  try {
    assert.equal((await migrateLegacyCredential(root, "openai")).skipped, true);
    await configureCredential(root, "openai", "value", { dryRun: false, storage: "encrypted" });
    assert.equal((await migrateLegacyCredential(root, "openai")).skipped, true);
    assert.equal((await recoverCredential(root, "openai")).skipped, true);

    await removeCredential(root, "openai", { dryRun: false });
    const archiveDirectory = path.join(root, ".credentials", "archive");
    await mkdir(archiveDirectory, { recursive: true });
    await writeFile(path.join(archiveDirectory, "openai-999.enc.json"), "invalid", "utf8");
    await assert.rejects(() => recoverCredential(root, "openai"));
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("rotation restores the original credential when replacement activation fails", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-rotation-rollback-"));
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "rollback-passphrase";
  try {
    await configureCredential(root, "openai", "original", { dryRun: false, storage: "encrypted" });
    await mkdir(path.join(root, ".ai-workspace", "local-secrets", "openai.env"), { recursive: true });
    await assert.rejects(() => rotateCredential(root, "openai", "replacement", { dryRun: false, storage: "local" }));
    assert.equal(await readCredential(root, "openai"), "original");
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy migration cleans temporary output when its exclusive backup conflicts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "credential-migration-rollback-"));
  const previousKey = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  const previousNow = Date.now;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "test-only-master-key";
  Date.now = () => 123456789;
  try {
    const target = path.join(root, ".credentials", "openai.enc.json");
    const backup = path.join(root, ".credentials", "legacy", "openai-123456789.enc.json");
    await mkdir(path.dirname(target), { recursive: true });
    await mkdir(path.dirname(backup), { recursive: true });
    await writeFile(target, `${JSON.stringify({ schemaVersion: 1, algorithm: "aes-256-gcm", variable: "OPENAI_API_KEY", iv: "AQEBAQEBAQEBAQEB", tag: "UAxJ0+38ls99Qmm7UTS6NA==", ciphertext: "RGKdbrGswjciK6iP" }, null, 2)}\n`);
    await writeFile(backup, "existing-backup", "utf8");
    await assert.rejects(() => migrateLegacyCredential(root, "openai", { dryRun: false, yes: true }));
    assert.equal((await readFile(target, "utf8")).includes('"schemaVersion": 1'), true);
    const credentialFiles = await readdir(path.dirname(target));
    assert.equal(credentialFiles.some((entry) => entry.endsWith(".migration")), false);
  } finally {
    Date.now = previousNow;
    if (previousKey === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY; else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previousKey;
    await rm(root, { recursive: true, force: true });
  }
});
