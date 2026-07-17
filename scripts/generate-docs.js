import process from "node:process";
import { generateCanonicalDocumentation, verifyCanonicalDocumentation } from "../src/documentation-generator.js";

const verify = process.argv.includes("--verify");
const result = verify ? await verifyCanonicalDocumentation(process.cwd()) : await generateCanonicalDocumentation(process.cwd(), { dryRun: !process.argv.includes("--apply") });
console.log(JSON.stringify(result, null, 2));
if (verify && !result.valid) process.exitCode = 1;
