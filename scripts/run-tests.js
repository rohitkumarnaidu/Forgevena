import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const configured = process.env.FORGEVENA_TEST_TMPDIR;
const fallback = path.resolve(configured || path.join("cache", "test-tmp"));
const temporaryRoot = await writableTemporaryRoot(fallback);
const args = ["--test", "--test-force-exit"];
if (process.argv.includes("--coverage")) args.push("--experimental-test-coverage");
args.push(...process.argv.slice(2).filter((argument) => argument !== "--coverage"));

const child = spawn(process.execPath, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    FORGEVENA_TEST_TMPDIR: temporaryRoot,
    TMP: temporaryRoot,
    TEMP: temporaryRoot,
    TMPDIR: temporaryRoot,
  },
});

let spawnFailed = false;
child.once("error", (error) => {
  spawnFailed = true;
  console.error(error);
});
child.once("close", (code, signal) => {
  if (signal) {
    console.error(`Test runner terminated by ${signal}.`);
  }
  process.exit(spawnFailed || signal ? 1 : (code ?? 1));
});

async function writableTemporaryRoot(fallbackPath) {
  try {
    const probe = await mkdtemp(path.join(os.tmpdir(), "forgevena-test-probe-"));
    await rm(probe, { recursive: true, force: true });
    return os.tmpdir();
  } catch {
    await mkdir(fallbackPath, { recursive: true });
    return fallbackPath;
  }
}
