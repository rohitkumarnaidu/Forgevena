import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { canonicalEngineeringAsset, engineeringAssetStatus, installEngineeringAsset, listEngineeringAssets, removeEngineeringAsset, trustEngineeringAssetPublisher, validateEngineeringAsset, verifyEngineeringAsset } from "../src/engineering-assets.js";

test("signed engineering assets require policy approval and retain provenance", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-skills-"));
  try {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    await trustEngineeringAssetPublisher(root, "official", publicKey.export({ type: "spki", format: "pem" }), { dryRun: false });
    const unsigned = validateEngineeringAsset({ schemaVersion: 1, kind: "skill", id: "secure-review", version: "1.0.0", description: "Review code", content: "Review {{target}} safely.", provenance: { author: "Forgevena", source: "local", license: "MIT" }, variables: [{ name: "target", required: true, description: "Review target" }], capabilities: ["code.review"], compatibility: { forgevena: ">=1.1.0" } });
    const value = sign(null, Buffer.from(canonicalEngineeringAsset(unsigned)), privateKey).toString("base64");
    const source = path.join(root, "skill.json");
    await writeFile(source, JSON.stringify({ ...unsigned, signature: { publisher: "official", algorithm: "ed25519", value } }));
    assert.equal((await verifyEngineeringAsset(root, source)).valid, true);
    await assert.rejects(() => installEngineeringAsset(root, source, { principal: "dev", dryRun: false, authorizeImpl: async () => ({ decision: "deny" }) }), (error) => error.code === "SKILL_POLICY_DENIED");
    const authorizeImpl = async (_root, request) => ({ decision: "allow", request });
    const installed = await installEngineeringAsset(root, source, { principal: "dev", dryRun: false, authorizeImpl });
    assert.equal(installed.installed, true);
    assert.equal((await listEngineeringAssets(root, "skill"))[0].provenance.license, "MIT");
    assert.equal((await engineeringAssetStatus(root, "skill", "secure-review")).contentIncluded, false);
    assert.equal((await installEngineeringAsset(root, source, { principal: "dev", dryRun: false, authorizeImpl })).skipped, true);
    assert.equal((await removeEngineeringAsset(root, "skill", "secure-review", { dryRun: false })).cachedPackagePreserved, true);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("engineering assets reject missing principals and invalid provenance", async () => {
  assert.throws(() => validateEngineeringAsset({ schemaVersion: 1, kind: "prompt", id: "bad", version: "1.0.0", content: "text", provenance: {} }), (error) => error.code === "SKILL_PROVENANCE_INVALID");
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-skills-principal-"));
  try { await assert.rejects(() => installEngineeringAsset(root, path.join(root, "missing.json")), (error) => error.code === "SKILL_PRINCIPAL_REQUIRED"); }
  finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
