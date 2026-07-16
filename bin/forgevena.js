#!/usr/bin/env node

import { run } from "../src/cli.js";
import { renderError } from "../src/cli/output.js";

run(process.argv.slice(2)).catch((error) => {
  console.error(process.argv.includes("--structured") ? renderError(error) : `Error: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
});
