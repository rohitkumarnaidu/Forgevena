import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PROVIDER_DEFINITIONS } from "./provider-runtime.js";

export const PROVIDER_COMPATIBILITY_MANIFEST = path.join("providers", "compatibility-evidence.json");

export async function verifyProviderCompatibility(root) {
  const issues = [];
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(root, PROVIDER_COMPATIBILITY_MANIFEST), "utf8")); }
  catch { return { valid: false, issues: ["Provider compatibility manifest is missing or invalid."], providersChecked: 0 }; }
  const expected = ["openai", "claude", "gemini", "openrouter", "ollama"];
  const records = manifest.providers ?? [];
  for (const provider of expected) if (!records.some((entry) => entry.provider === provider)) issues.push(`Compatibility evidence is missing ${provider}.`);
  for (const record of records) {
    if (!expected.includes(record.provider)) issues.push(`Compatibility evidence cannot certify ${record.provider}.`);
    if (!PROVIDER_DEFINITIONS[record.provider]) issues.push(`Unknown provider ${record.provider}.`);
    if (record.support !== "preview" && record.liveVerified !== true) issues.push(`${record.provider} cannot claim ${record.support} without live evidence.`);
    if (record.liveVerified !== false) issues.push(`${record.provider} fixture evidence must explicitly declare liveVerified false until an account-backed smoke test passes.`);
    if (!record.fixture || !record.fixtureSha256) { issues.push(`${record.provider} fixture reference is incomplete.`); continue; }
    try {
      const fixture = await readFile(path.join(root, record.fixture), "utf8");
      if (fixtureChecksum(fixture) !== record.fixtureSha256) issues.push(`${record.provider} fixture checksum does not match.`);
    } catch { issues.push(`${record.provider} fixture is missing.`); }
  }
  return { valid: issues.length === 0, issues, providersChecked: records.length, liveProvidersVerified: records.filter((entry) => entry.liveVerified).length, support: "offline-contract-evidence" };
}

function fixtureChecksum(contents) {
  const canonical = contents.replace(/\r\n?/g, "\n");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
