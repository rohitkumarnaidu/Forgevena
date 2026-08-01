import process from "node:process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { verifyReleasePackage } from "../src/release.js";
import { verifySupplyChainReadiness } from "../src/supply-chain.js";
import { verifyCanonicalDocumentation } from "../src/documentation-generator.js";
import { renderReleaseRetrospective, validateReleaseRetrospectives } from "../src/release-retrospective.js";
import { generateVersionDocumentation } from "../src/version-documentation.js";
import { verifyProviderCompatibility } from "../src/provider-compatibility.js";

const root = process.cwd();
const [release, supplyChain, documentation, retrospective, versionDocumentation, providerCompatibility] = await Promise.all([verifyReleasePackage(root), verifySupplyChainReadiness(root), verifyCanonicalDocumentation(root), verifyRetrospectives(root), generateVersionDocumentation(root), verifyProviderCompatibility(root)]);
const result = { valid: release.valid && supplyChain.valid && documentation.valid && retrospective.valid && versionDocumentation.valid && providerCompatibility.valid, release, supplyChain, documentation, retrospective, versionDocumentation, providerCompatibility };
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;

async function verifyRetrospectives(root) {
  try {
    const document = JSON.parse(await readFile(path.join(root, "docs/governance/release-retrospectives.json"), "utf8"));
    const validation = validateReleaseRetrospectives(document);
    const expected = renderReleaseRetrospective(document).replace(/\r\n/g, "\n");
    const actual = (await readFile(path.join(root, "docs/reports/HISTORICAL_RELEASE_GOVERNANCE_RETROSPECTIVE.md"), "utf8")).replace(/\r\n/g, "\n");
    const issues = [...validation.issues];
    if (actual !== expected) issues.push("Historical release governance retrospective is stale.");
    return { valid: issues.length === 0, issues, releasesChecked: validation.releasesChecked };
  } catch (error) { return { valid: false, issues: [error.message], releasesChecked: 0 }; }
}
