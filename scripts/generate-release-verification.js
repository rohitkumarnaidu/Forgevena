import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_TARGETS = [
  ["ubuntu-latest", "20"],
  ["ubuntu-latest", "22"],
  ["windows-latest", "20"],
  ["windows-latest", "22"],
  ["macos-latest", "20"],
  ["macos-latest", "22"],
];

function argumentValue(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

export function buildReleaseVerification({
  releaseRef,
  commit,
  repository,
  runId,
  runAttempt = "1",
  generatedAt = new Date().toISOString(),
  jobs,
}) {
  const runUrl = `https://github.com/${repository}/actions/runs/${runId}`;
  const checks = REQUIRED_TARGETS.map(([operatingSystem, nodeVersion]) => {
    const expectedName = `verify (${operatingSystem}, ${nodeVersion})`;
    const job = jobs.find((candidate) => candidate.name === expectedName);
    if (!job) {
      throw new Error(`Missing required release verification job: ${expectedName}`);
    }
    if (job.conclusion !== "success") {
      throw new Error(`Release verification job did not pass: ${expectedName} (${job.conclusion})`);
    }
    return {
      name: expectedName,
      operatingSystem,
      nodeVersion,
      status: job.conclusion,
      url: job.html_url || runUrl,
    };
  });

  return {
    schemaVersion: "1.0.0",
    releaseRef,
    commit,
    repository,
    workflowRun: {
      id: String(runId),
      attempt: String(runAttempt),
      url: runUrl,
    },
    generatedAt,
    status: "passed",
    commands: ["npm test", "npm run release:verify", "npm pack --dry-run"],
    checks,
  };
}

export function renderReleaseVerification(verification) {
  const rows = verification.checks
    .map((check) => `| ${check.operatingSystem} | ${check.nodeVersion} | Passed | [Job](${check.url}) |`)
    .join("\n");
  return `## Release verification

All required operating-system and Node.js targets passed before release assets were generated.

| Operating system | Node.js | Result | Evidence |
| --- | ---: | --- | --- |
${rows}

- Release: \`${verification.releaseRef}\`
- Commit: \`${verification.commit}\`
- Workflow: [run ${verification.workflowRun.id}](${verification.workflowRun.url}) (attempt ${verification.workflowRun.attempt})
- Commands: \`${verification.commands.join("\`, \`")}\`
- Generated: ${verification.generatedAt}
`;
}

export async function generateReleaseVerification({ jobsPath, outputDirectory, ...metadata }) {
  const payload = JSON.parse(await readFile(jobsPath, "utf8"));
  const verification = buildReleaseVerification({ ...metadata, jobs: payload.jobs || [] });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    resolve(outputDirectory, "release-verification.json"),
    `${JSON.stringify(verification, null, 2)}\n`,
  );
  await writeFile(
    resolve(outputDirectory, "RELEASE_VERIFICATION.md"),
    renderReleaseVerification(verification),
  );
  return verification;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generateReleaseVerification({
    jobsPath: resolve(argumentValue("jobs")),
    outputDirectory: resolve(argumentValue("output", "dist")),
    releaseRef: argumentValue("release-ref"),
    commit: argumentValue("commit"),
    repository: argumentValue("repository"),
    runId: argumentValue("run-id"),
    runAttempt: argumentValue("run-attempt", "1"),
  });
}
