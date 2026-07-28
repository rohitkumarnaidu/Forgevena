import { validateGovernance } from "../src/governance-validation.js";

const report = await validateGovernance(process.cwd());
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
