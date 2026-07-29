import process from "node:process";
import { createVersionBundle, generateVersionDocumentation } from "../src/version-documentation.js";

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const version = value("--version");
const checkpoint = value("--checkpoint") ?? "planning";

if (args.includes("--bundle")) {
  const result = await createVersionBundle(process.cwd(), version, checkpoint);
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
} else {
  const result = await generateVersionDocumentation(process.cwd(), { apply: args.includes("--apply"), version });
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

