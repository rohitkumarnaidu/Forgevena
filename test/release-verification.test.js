import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildReleaseVerification,
  generateReleaseVerification,
  renderReleaseVerification,
} from "../scripts/generate-release-verification.js";

const jobs = ["ubuntu-latest", "windows-latest", "macos-latest"].flatMap((operatingSystem) =>
  ["20", "22"].map((nodeVersion, index) => ({
    name: `verify (${operatingSystem}, ${nodeVersion})`,
    conclusion: "success",
    html_url: `https://github.com/example/forgevena/actions/jobs/${operatingSystem}-${index}`,
  })),
);

const metadata = {
  releaseRef: "v1.2.1",
  commit: "0123456789abcdef",
  repository: "example/forgevena",
  runId: "1234",
  runAttempt: "2",
  generatedAt: "2026-07-18T00:00:00.000Z",
};

test("release verification requires every supported OS and Node target", () => {
  const verification = buildReleaseVerification({ ...metadata, jobs });
  assert.equal(verification.status, "passed");
  assert.equal(verification.checks.length, 6);
  assert.ok(verification.checks.every((check) => check.status === "success"));
  assert.throws(
    () => buildReleaseVerification({ ...metadata, jobs: jobs.slice(1) }),
    /Missing required release verification job/,
  );
});

test("release verification rejects unsuccessful matrix jobs", () => {
  const failedJobs = jobs.map((job, index) => index === 0 ? { ...job, conclusion: "failure" } : job);
  assert.throws(
    () => buildReleaseVerification({ ...metadata, jobs: failedJobs }),
    /did not pass/,
  );
});

test("release verification renders auditable Markdown and JSON assets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgevena-release-verification-"));
  const jobsPath = join(directory, "jobs.json");
  await writeFile(jobsPath, JSON.stringify({ jobs }));
  const verification = await generateReleaseVerification({
    ...metadata,
    jobsPath,
    outputDirectory: directory,
  });
  const markdown = await readFile(join(directory, "RELEASE_VERIFICATION.md"), "utf8");
  const json = JSON.parse(await readFile(join(directory, "release-verification.json"), "utf8"));
  assert.match(markdown, /Release verification/);
  assert.match(renderReleaseVerification(verification), /windows-latest/);
  assert.equal(json.workflowRun.url, "https://github.com/example/forgevena/actions/runs/1234");
  assert.equal(json.checks.length, 6);
});
