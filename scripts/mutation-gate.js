import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const threshold = 80;
const configuredRoot = process.env.FORGEVENA_TEST_TMPDIR;
const mutationRoot = path.resolve(configuredRoot || path.join("cache", "mutation-tmp"));
await mkdir(mutationRoot, { recursive: true });
const runRoot = await mkdtemp(path.join(mutationRoot, "forgevena-mutation-"));

const mutants = [
  mutation("state-checksum-comparison", "state", "state-engine.js", "if (expected !== actual)", "if (expected === actual)", verifyStateChecksum),
  mutation("state-workspace-boundary", "state", "state-engine.js", "target !== workspace && !target.startsWith", "target !== workspace || !target.startsWith", verifyStateWrite),
  mutation("state-recovery-selection", "state", "state-engine.js", "entry.status === \"prepared\"", "entry.status !== \"prepared\"", verifyStateRecovery),
  mutation("state-validation-success", "state", "state-engine.js", "result === true || result === undefined", "result === true && result === undefined", verifyStateValidation),
  mutation("vault-algorithm-check", "vault", "credentials.js", "payload.algorithm !== \"aes-256-gcm\"", "payload.algorithm === \"aes-256-gcm\"", verifyVaultRoundTrip),
  mutation("vault-schema-check", "vault", "credentials.js", "if (payload.schemaVersion !== VAULT_SCHEMA_VERSION) throw new Error(`Unsupported credential vault schema version: ${payload.schemaVersion}.`);", "if (payload.schemaVersion === VAULT_SCHEMA_VERSION) throw new Error(`Unsupported credential vault schema version: ${payload.schemaVersion}.`);", verifyVaultRoundTrip),
  mutation("vault-protected-variable", "vault", "credentials.js", "metadata.variable !== variable", "metadata.variable === variable", verifyVaultRoundTrip),
  mutation("vault-authentication-tag", "vault", "credentials.js", "decipher.setAAD(protectedMetadata);\r\n    decipher.setAuthTag(Buffer.from(payload.tag, \"base64\"));", "decipher.setAAD(protectedMetadata);\r\n    decipher.setAuthTag(Buffer.from(payload.iv, \"base64\"));", verifyVaultRoundTrip),
  mutation("consent-preview-boundary", "consent", "consent.js", "if (dryRun || !apply)", "if (dryRun && !apply)", verifyConsentPreview),
  mutation("consent-explicit-approval", "consent", "consent.js", "approved: true, reason: \"explicit-yes\"", "approved: false, reason: \"explicit-yes\"", verifyConsentApproval),
  mutation("consent-approval-reason", "consent", "consent.js", "reason: \"explicit-yes\"", "reason: \"preview\"", verifyConsentApproval),
  mutation("policy-missing-default", "policy", "org-policy.js", "if (!bundle) return { decision: \"deny\"", "if (!bundle) return { decision: \"allow\"", verifyPolicyDenial),
  mutation("policy-signature-boundary", "policy", "org-policy.js", "if (!signature.trusted) return { decision: \"deny\"", "if (signature.trusted) return { decision: \"deny\"", verifyPolicyDenial),
  mutation("policy-unknown-principal", "policy", "org-policy.js", "request, \"deny\", \"unknown-principal\"", "request, \"allow\", \"unknown-principal\"", verifyPolicyDenial),
  mutation("policy-deny-overrides", "policy", "org-policy.js", "denied.length ? \"deny\" : allowed.length ? \"allow\" : \"deny\"", "denied.length ? \"allow\" : allowed.length ? \"allow\" : \"deny\"", verifyPolicyDenial),
  mutation("rollback-content-ownership", "rollback", "project.js", "hashContents(contents) === asset.hash", "hashContents(contents) !== asset.hash", verifyRollbackOwnership),
  mutation("rollback-preview-boundary", "rollback", "project.js", "if (dryRun) return { ...result", "if (!dryRun) return { ...result", verifyRollbackPreview),
  mutation("rollback-explicit-approval", "rollback", "project.js", "if (!yes) throw new Error(\"Rollback removes managed files", "if (yes) throw new Error(\"Rollback removes managed files", verifyRollbackApproval),
  mutation("rollback-latest-operation", "rollback", "project.js", "operation.id !== manifest.operations.at(-1)?.id", "operation.id === manifest.operations.at(-1)?.id", verifyRollbackPreview),
];

const results = [];
try {
  for (const [index, mutant] of mutants.entries()) results.push(await runMutant(mutant, index));
} finally {
  await rm(runRoot, { recursive: true, force: true });
}

const killed = results.filter((result) => result.status === "killed").length;
const score = Number(((killed / results.length) * 100).toFixed(2));
const domains = Object.fromEntries([...new Set(results.map(({ domain }) => domain))].map((domain) => {
  const selected = results.filter((result) => result.domain === domain);
  const domainKilled = selected.filter((result) => result.status === "killed").length;
  return [domain, { killed: domainKilled, total: selected.length, score: Number(((domainKilled / selected.length) * 100).toFixed(2)) }];
}));
const valid = score >= threshold && Object.values(domains).every((domain) => domain.score >= threshold);
console.log(JSON.stringify({ threshold, score, killed, total: results.length, domains, valid, results }, null, 2));
if (!valid) process.exitCode = 1;

function mutation(id, domain, file, search, replacement, verify) { return { id, domain, file, search, replacement, verify }; }

async function runMutant(mutant, index) {
  const caseRoot = path.join(runRoot, `${String(index).padStart(2, "0")}-${mutant.id}`);
  const sourceRoot = path.join(caseRoot, "src");
  await cp(path.resolve("src"), sourceRoot, { recursive: true });
  await cp(path.resolve("modules"), path.join(caseRoot, "modules"), { recursive: true });
  await copyOptionalDirectory("templates", caseRoot);
  await cp(path.resolve("package.json"), path.join(caseRoot, "package.json"));
  const target = path.join(sourceRoot, mutant.file);
  const original = await readFile(target, "utf8");
  const occurrences = original.split(mutant.search).length - 1;
  if (occurrences !== 1) return { id: mutant.id, domain: mutant.domain, status: "invalid", reason: `Expected one mutation point, found ${occurrences}.` };
  await writeFile(target, original.replace(mutant.search, mutant.replacement), "utf8");
  const workspace = path.join(caseRoot, "workspace");
  await mkdir(workspace, { recursive: true });
  try {
    const module = await import(`${pathToFileURL(target).href}?mutant=${encodeURIComponent(mutant.id)}`);
    await mutant.verify(module, workspace);
    return { id: mutant.id, domain: mutant.domain, status: "survived" };
  } catch (error) {
    if (["ERR_MODULE_NOT_FOUND", "MODULE_NOT_FOUND"].includes(error.code)) return { id: mutant.id, domain: mutant.domain, status: "invalid", reason: error.message };
    return { id: mutant.id, domain: mutant.domain, status: "killed", evidence: error.code ?? error.name ?? "ASSERTION_FAILED", message: error.message };
  }
}

async function copyOptionalDirectory(relative, destinationRoot) {
  try {
    await cp(path.resolve(relative), path.join(destinationRoot, relative), { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function verifyStateChecksum({ FileStateEngine }, root) {
  const relative = ".ai-workspace/workspace.json";
  const state = new FileStateEngine(root);
  await state.write(relative, { value: "original" });
  await writeFile(path.join(root, relative), "{}\n");
  await assert.rejects(() => state.read(relative), (error) => error.code === "STATE_CHECKSUM_MISMATCH");
}

async function verifyStateWrite({ FileStateEngine }, root) {
  const state = new FileStateEngine(root);
  await state.write(".ai-workspace/workspace.json", { value: true });
  assert.deepEqual(await state.read(".ai-workspace/workspace.json"), { value: true });
}

async function verifyStateRecovery({ FileStateEngine }, root) {
  const relative = ".ai-workspace/workspace.json";
  const operationId = "mutation-recovery";
  const state = new FileStateEngine(root);
  await state.write(relative, { value: "original" });
  const target = path.join(root, relative);
  const backup = `${target}.${operationId}.backup`;
  await cp(target, backup);
  await state.write(relative, { value: "changed" });
  const journalRoot = path.join(root, ".ai-workspace", "journal");
  await mkdir(journalRoot, { recursive: true });
  await writeFile(path.join(journalRoot, `${operationId}.json`), `${JSON.stringify({ schemaVersion: 1, operationId, status: "prepared", startedAt: new Date().toISOString(), changes: [{ relativePath: relative, backup: path.relative(root, backup) }] })}\n`);
  assert.deepEqual(await state.recover(), { recovered: [operationId] });
  assert.deepEqual(await state.read(relative), { value: "original" });
}

async function verifyStateValidation({ FileStateEngine }, root) {
  const state = new FileStateEngine(root);
  await state.write(".ai-workspace/workspace.json", { valid: true }, { validate: () => true });
}

async function verifyVaultRoundTrip(module, root) {
  const previous = process.env.AI_WORKSPACE_CREDENTIAL_KEY;
  process.env.AI_WORKSPACE_CREDENTIAL_KEY = "mutation-gate-passphrase";
  try {
    await module.configureCredential(root, "openai", "mutation-secret", { dryRun: false, storage: "encrypted" });
    assert.equal(await module.readCredential(root, "openai"), "mutation-secret");
  } finally {
    if (previous === undefined) delete process.env.AI_WORKSPACE_CREDENTIAL_KEY;
    else process.env.AI_WORKSPACE_CREDENTIAL_KEY = previous;
  }
}

async function verifyConsentPreview({ approveExternalAction }) {
  const result = await approveExternalAction({ command: "network-command" }, { dryRun: true, apply: true, yes: false, nonInteractive: true });
  assert.equal(result.approved, false);
  assert.equal(result.reason, "preview");
}

async function verifyConsentApproval({ approveExternalAction }) {
  const result = await approveExternalAction({ command: "network-command" }, { dryRun: false, apply: true, yes: true, nonInteractive: true });
  assert.equal(result.approved, true);
  assert.equal(result.reason, "explicit-yes");
}

async function verifyPolicyDenial(module, root) {
  assert.equal((await module.evaluateOrganizationPolicy(root, { principal: "member", action: "provider.invoke", resource: "openai" })).decision, "deny");
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  await module.trustOrganizationSigner(root, "mutation-signer", publicKeyPem, { dryRun: false });
  const bundle = {
    schemaVersion: 1,
    organization: { id: "mutation-org", name: "Mutation Organization" },
    version: "1.0.0",
    projects: [],
    workspaces: [],
    principals: [{ id: "member", roles: ["engineer"] }],
    roles: [{ id: "engineer", statements: [{ effect: "allow", actions: ["provider.*"], resources: ["*"], capabilities: [] }] }],
    approvals: { providers: ["openai"], plugins: [], templates: [] },
    rules: [{ effect: "deny", actions: ["provider.invoke"], resources: ["openai"], capabilities: [] }],
  };
  bundle.signature = { signer: "mutation-signer", algorithm: "ed25519", value: sign(null, Buffer.from(module.canonicalOrganizationPolicy(bundle)), privateKey).toString("base64") };
  const source = path.join(root, "policy.json");
  await writeFile(source, `${JSON.stringify(bundle)}\n`);
  await module.importOrganizationPolicy(root, source, { dryRun: false });
  assert.equal((await module.evaluateOrganizationPolicy(root, { principal: "unknown", action: "provider.invoke", resource: "openai" })).decision, "deny");
  const denied = await module.evaluateOrganizationPolicy(root, { principal: "member", action: "provider.invoke", resource: "openai" });
  assert.equal(denied.decision, "deny");
  assert.equal(denied.reason, "explicit-deny");
}

async function bootstrap(module, root) {
  return module.initializeProject(root, { dryRun: false, createProject: true, projectName: "mutation-project", template: "blank" });
}

async function verifyRollbackOwnership(module, root) {
  const created = await bootstrap(module, root);
  const relative = created.created.find((entry) => !entry.startsWith(".ai-workspace/"));
  assert.ok(relative);
  await writeFile(path.join(root, relative), "user-modified\n");
  const preview = await module.rollbackProject(root, null, { dryRun: true });
  assert.ok(preview.modified.includes(relative));
  assert.ok(!preview.removable.includes(relative));
}

async function verifyRollbackPreview(module, root) {
  await bootstrap(module, root);
  const preview = await module.rollbackProject(root, null, { dryRun: true });
  assert.equal(preview.dryRun, true);
  assert.match(preview.confirmation, /Preview only/);
}

async function verifyRollbackApproval(module, root) {
  await bootstrap(module, root);
  await assert.rejects(() => module.rollbackProject(root, null, { dryRun: false, yes: false }), /requires --yes/);
}
