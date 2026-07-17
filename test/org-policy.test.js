import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { canonicalOrganizationPolicy, evaluateOrganizationPolicy, importOrganizationPolicy, organizationAudit, organizationComplianceReport, trustOrganizationSigner, validateActiveOrganizationPolicy } from "../src/org-policy.js";

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
