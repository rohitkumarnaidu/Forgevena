import process from "node:process";
import { renderError } from "./output.js";

export async function executeCli(run, argv = process.argv.slice(2), io = console) {
  try {
    await run(argv);
    return 0;
  } catch (error) {
    io.error(argv.includes("--structured") ? renderError(error) : `Error: ${error.message}`);
    return Number.isInteger(error.exitCode) ? error.exitCode : 1;
  }
}
