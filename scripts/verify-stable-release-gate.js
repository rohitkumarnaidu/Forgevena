import process from "node:process";
import { runStableReleaseGate } from "../src/stable-release-gate.js";

const allowHold = process.argv.includes("--allow-hold");
const result = await runStableReleaseGate(process.cwd(), { allowHold });
console.log(JSON.stringify(result, null, 2));
if (!result.accepted) process.exitCode = 1;
