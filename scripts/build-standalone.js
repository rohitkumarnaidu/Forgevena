import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const supportedTargets = new Set([
  "node22-win-x64",
  "node22-linux-x64",
  "node22-macos-x64",
]);

const target = valueAfter("--target") ?? defaultTarget();
if (!supportedTargets.has(target)) {
  throw new Error(`Unsupported standalone target: ${target}. Expected one of ${[...supportedTargets].join(", ")}.`);
}

const output = path.resolve(valueAfter("--output") ?? defaultOutput(target));
await mkdir(path.dirname(output), { recursive: true });

const executable = path.resolve("node_modules", "@yao-pkg", "pkg", "lib-es5", "bin.js");
await access(executable);

await run(process.execPath, [
  executable,
  "./bin/forgevena.js",
  "--config",
  "./package.json",
  "--targets",
  target,
  "--output",
  output,
  "--compress",
  "GZip",
  "--no-signature",
  "--fallback-to-source",
]);

console.log(JSON.stringify({ target, output }, null, 2));

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function defaultTarget() {
  const platform = { win32: "win", linux: "linux", darwin: "macos" }[process.platform];
  const architecture = { x64: "x64" }[process.arch];
  if (!platform || !architecture) throw new Error(`Unsupported build host: ${process.platform}-${process.arch}.`);
  return `node22-${platform}-${architecture}`;
}

function defaultOutput(selectedTarget) {
  const [, platform, architecture] = selectedTarget.split("-");
  const extension = platform === "win" ? ".exe" : "";
  return path.join("dist", "standalone", `forgevena-${platform}-${architecture}${extension}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "inherit", shell: false });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Standalone build failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
    });
  });
}
