import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProjectIndex, projectIndexStatus, projectRecommendations, queryProjectIndex, readProjectIndex } from "../src/project-index.js";

test("project index captures metadata, symbols, and relationships without contents", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-index-"));
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, "docs"), { recursive: true });
    await writeFile(path.join(root, "src", "main.js"), `import { helper } from "./helper.js";\nexport function start() { return helper(); }\nexport class App {}\n`);
    await writeFile(path.join(root, "src", "helper.js"), `export const helper = () => "secret-source-content";\n`);
    await writeFile(path.join(root, "docs", "guide.md"), `# Guide\n\nSee [API](api.md).\n`);
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "example", dependencies: { lodash: "1.0.0" } }));
    const preview = await buildProjectIndex(root, { dryRun: true });
    assert.equal(preview.contentStored, false);
    const result = await buildProjectIndex(root, { dryRun: false });
    assert.equal(result.indexed, true);
    const status = await projectIndexStatus(root);
    assert.equal(status.counts.source, 2);
    assert.ok(status.counts.symbols >= 4);
    const symbols = await queryProjectIndex(root, "start function");
    assert.equal(symbols.results[0].type, "symbol");
    assert.equal(symbols.contentReturned, false);
    const dependencies = await queryProjectIndex(root, "lodash depends-on");
    assert.equal(dependencies.results[0].type, "relationship");
    assert.equal(JSON.stringify(symbols).includes("secret-source-content"), false);
    assert.equal((await readProjectIndex(root)).relationships.some(({ to }) => to === "secret-source-content"), false);
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("project index requires a build before querying", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-index-empty-"));
  try { await assert.rejects(() => queryProjectIndex(root, "test"), /not initialized/); }
  finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});

test("project recommendations are deterministic metadata-only plans", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "forgevena-recommendations-"));
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "main.js"), "export function start() { return true; }\n");
    await buildProjectIndex(root, { dryRun: false });
    const result = await projectRecommendations(root);
    assert.equal(result.readOnly, true);
    assert.equal(result.contentInspected, false);
    assert.equal(result.projectFilesChanged, false);
    assert.ok(result.recommendations.some(({ id }) => id === "TESTS_NOT_DETECTED"));
    assert.ok(result.recommendations.every(({ mutationRequiresPreviewAndConsent }) => mutationRequiresPreviewAndConsent));
  } finally { await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
