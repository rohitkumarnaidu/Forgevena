import { validateDocumentationAssets } from "../src/documentation-assets.js";

const report = await validateDocumentationAssets(process.cwd(), { executeExamples: !process.argv.includes("--no-execute") });
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
