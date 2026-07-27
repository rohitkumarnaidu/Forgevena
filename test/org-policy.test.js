import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { canonicalOrganizationPolicy, evaluateOrganizationPolicy, importOrganizationPolicy, organizationAudit, organizationComplianceReport, trustOrganizationSigner, validateActiveOrganizationPolicy, validateOrganizationPolicy, verifyOrganizationPolicy } from "../src/org-policy.js";

test("signed local organization policies enforce deny overrides", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-org-"));
  try {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    await trustOrganizationSigner(root, "security", publicKey.export({ type: "spki", format: "pem" }), { dryRun: false });
    const unsigned = {
      schemaVersion: 1,
      organization: { id: "acme", name: "Acme" },
      version: "1.0.0",
      projects: [{ id: "platform", name: "platform" }],
      workspaces: [{ id: "local", name: "local" }],
      principals: [{ id: "dev@example.com", roles: ["developer"] }],
      roles: [{ id: "developer", statements: [{ effect: "allow", actions: ["provider.invoke"], resources: ["provider:*"], capabilities: [] }] }],
      approvals: { providers: ["openai"], plugins: [], templates: ["react"] },
      rules: [{ effect: "deny", actions: ["provider.invoke"], resources: ["provider:openai"], capabilities: [] }],
    };
    const signature = sign(null, Buffer.from(canonicalOrganizationPolicy(unsigned)), privateKey).toString("base64");
    const source = path.join(root, "policy.json");
    await writeFile(source, JSON.stringify({ ...unsigned, signature: { signer: "security", algorithm: "ed25519", value: signature } }));
    assert.equal((await importOrganizationPolicy(root, source, { dryRun: false })).imported, true);
    assert.equal((await validateActiveOrganizationPolicy(root)).valid, true);
    const denied = await evaluateOrganizationPolicy(root, { principal: "dev@example.com", action: "provider.invoke", resource: "provider:openai" });
    assert.equal(denied.decision, "deny");
    assert.equal(denied.reason, "explicit-deny");
    const allowed = await evaluateOrganizationPolicy(root, { principal: "dev@example.com", action: "provider.invoke", resource: "provider:ollama" });
    assert.equal(allowed.decision, "allow");
    const implicit = await evaluateOrganizationPolicy(root, { principal: "dev@example.com", action: "plugin.install", resource: "plugin:unknown" });
    assert.equal(implicit.decision, "deny");
    assert.equal((await organizationComplianceReport(root)).denyOverrides, true);
    assert.ok((await organizationAudit(root)).entries.length >= 4);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("organization policies reject untrusted signers", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-org-untrusted-"));
  try {
    const source = path.join(root, "policy.json");
    await writeFile(source, JSON.stringify({ schemaVersion: 1, organization: { id: "acme", name: "Acme" }, version: "1.0.0", projects: [], workspaces: [], principals: [], roles: [], approvals: {}, rules: [], signature: { signer: "unknown", algorithm: "ed25519", value: "invalid" } }));
    await assert.rejects(() => importOrganizationPolicy(root, source, { dryRun: false }), (error) => error.code === "ORG_POLICY_UNTRUSTED");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("organization policy validation rejects every malformed contract branch", () => {
  const valid = { schemaVersion: 1, organization: { id: "acme", name: "Acme" }, version: "1.0.0", projects: [], workspaces: [], principals: [], roles: [], approvals: {}, rules: [] };
  const invalid = [
    [{ ...valid, schemaVersion: 2 }, "ORG_POLICY_SCHEMA_INVALID"],
    [{ ...valid, organization: { id: "../bad", name: "Bad" } }, "ORG_POLICY_ORGANIZATION_INVALID"],
    [{ ...valid, version: "one" }, "ORG_POLICY_VERSION_INVALID"],
    [{ ...valid, roles: {} }, "ORG_POLICY_ARRAY_INVALID"],
    [{ ...valid, roles: [{ id: "../bad", statements: [] }] }, "ORG_POLICY_ID_INVALID"],
    [{ ...valid, roles: [{ id: "dev", statements: [{ effect: "maybe" }] }] }, "ORG_POLICY_EFFECT_INVALID"],
    [{ ...valid, principals: [{ id: "dev", roles: ["missing"] }] }, "ORG_POLICY_ROLE_UNKNOWN"],
    [{ ...valid, projects: [{ id: "../bad" }] }, "ORG_POLICY_ID_INVALID"],
  ];
  for (const [value, code] of invalid) assert.throws(() => validateOrganizationPolicy(value), (error) => error.code === code);
  const normalized = validateOrganizationPolicy({ ...valid, projects: ["project"], workspaces: [{ id: "workspace" }], approvals: { providers: ["openai", "openai"] } });
  assert.deepEqual(normalized.projects, [{ id: "project" }]);
  assert.equal(normalized.workspaces[0].name, "workspace");
  assert.deepEqual(normalized.approvals.providers, ["openai"]);
});

test("organization signer and empty-policy paths remain fail closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-org-validation-"));
  try {
    assert.equal((await validateActiveOrganizationPolicy(root)).configured, false);
    assert.equal((await evaluateOrganizationPolicy(root, {})).decision, "deny");
    assert.equal((await organizationComplianceReport(root)).valid, false);
    await assert.rejects(() => trustOrganizationSigner(root, "../bad", "invalid"), (error) => error.code === "ORG_SIGNER_INVALID");
    await assert.rejects(() => trustOrganizationSigner(root, "valid", "invalid"), (error) => error.code === "ORG_SIGNER_KEY_INVALID");
    const { publicKey } = generateKeyPairSync("ed25519");
    const pem = publicKey.export({ type: "spki", format: "pem" });
    assert.equal((await trustOrganizationSigner(root, "valid", pem)).dryRun, true);
    assert.equal((await trustOrganizationSigner(root, "valid", pem, { dryRun: false })).trusted, true);
    assert.equal((await trustOrganizationSigner(root, "valid", pem, { dryRun: false })).skipped, true);
    assert.equal((await verifyOrganizationPolicy(root, {})).trusted, false);
    assert.equal((await verifyOrganizationPolicy(root, { signature: { signer: "missing", algorithm: "ed25519", value: "bad" } })).reason, "signer is not trusted");
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
