import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { addModules } from "../src/project.js";

test("dry run never creates project files", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ai-workspace-"));
  try {
    const result = await addModules(directory, ["core"], { dryRun: true });
    assert.deepEqual(result.created, undefined);
    assert.equal(result.create.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("existing files are skipped and preserved", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ai-workspace-"));
  const stateDirectory = path.join(directory, ".ai-workspace");
  const designFile = path.join(stateDirectory, "README.md");
  try {
    await mkdir(stateDirectory);
    await writeFile(designFile, "existing\n");
    const result = await addModules(directory, ["core"], { dryRun: false });
    assert.deepEqual(result.created, []);
    assert.deepEqual(result.skipped, [".ai-workspace/README.md"]);
    assert.equal(await readFile(designFile, "utf8"), "existing\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
