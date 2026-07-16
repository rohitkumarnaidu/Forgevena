import process from "node:process";
import { verifyReleasePackage } from "../src/release.js";

const result = await verifyReleasePackage(process.cwd());
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
