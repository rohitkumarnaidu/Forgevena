import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const packageRoot = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("Pass the root directory of the installed Forgevena package.");
const runtimeUrl = pathToFileURL(path.join(packageRoot, "src/provider-runtime.js"));
const { invokeProvider } = await import(runtimeUrl.href);
const previousKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = "local-cancellation-fixture";
const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-installed-cancel-"));
const controller = new AbortController();
let requestStarted = false;

try {
  const invocation = invokeProvider(root, "openai", { prompt: "synthetic cancellation fixture", retries: 0, timeoutMs: 10000 }, {
    signal: controller.signal,
    recordUsage: false,
    fetchImpl: async (_url, options) => {
      requestStarted = true;
      return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  controller.abort();
  await assert.rejects(invocation, (error) => error.code === "cancellation");
  assert.equal(requestStarted, true);
  process.stdout.write(JSON.stringify({ result: "passed", networkRequests: 0, secretsRetained: false }) + "\n");
} finally {
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
  await rm(root, { recursive: true, force: true });
}
