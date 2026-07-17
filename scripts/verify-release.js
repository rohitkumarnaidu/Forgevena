import process from "node:process";
import { verifyReleasePackage } from "../src/release.js";
import { verifySupplyChainReadiness } from "../src/supply-chain.js";
import { verifyCanonicalDocumentation } from "../src/documentation-generator.js";

const [release, supplyChain, documentation] = await Promise.all([verifyReleasePackage(process.cwd()), verifySupplyChainReadiness(process.cwd()), verifyCanonicalDocumentation(process.cwd())]);
const result = { valid: release.valid && supplyChain.valid && documentation.valid, release, supplyChain, documentation };
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
