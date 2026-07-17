import process from "node:process";
import { generateSupplyChainArtifacts } from "../src/supply-chain.js";

const result = await generateSupplyChainArtifacts(process.cwd(), { dryRun: !process.argv.includes("--apply") });
console.log(JSON.stringify(result, null, 2));
