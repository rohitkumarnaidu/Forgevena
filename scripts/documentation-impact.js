import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeDocumentationImpact, renderDocumentationImpactMarkdown, validateDocumentationImpactReport } from "../src/documentation-impact.js";
import { writeDocumentationEvidenceBundle } from "../src/documentation-evidence.js";

const args = parseArgs(process.argv.slice(2));
const fileNotApplicable = args.notApplicableFile ? await readNotApplicable(args.notApplicableFile, args.checkpoint) : {};
let files;
try {
  files = args.files ? args.files.split(",") : args.workingTree ? workingTreeFiles() : changedFiles(args.base, args.head);
} catch (error) {
  console.error(JSON.stringify({ valid: false, issues: [`Unable to determine changed files: ${error.message}`] }, null, 2));
  process.exit(1);
}

const report = analyzeDocumentationImpact(files, {
  changeId: args.changeId,
  title: args.title,
  owner: args.owner,
  base: args.base,
  head: args.head,
  checkpoint: args.checkpoint,
  notApplicable: { ...fileNotApplicable, ...args.notApplicable },
});
const validation = validateDocumentationImpactReport(report);
if (args.jsonOutput) await writeOutput(args.jsonOutput, `${JSON.stringify(report, null, 2)}\n`);
if (args.markdownOutput) await writeOutput(args.markdownOutput, renderDocumentationImpactMarkdown(report));
if (args.outputDir) await writeDocumentationEvidenceBundle(process.cwd(), path.resolve(args.outputDir), report);
const output = args.markdown ? renderDocumentationImpactMarkdown(report) : JSON.stringify({ ...report, validation }, null, 2);
console.log(output);
if (!validation.valid || (args.check && report.decision !== "ready")) process.exitCode = 1;

function changedFiles(base, head) {
  if (!base || !head) throw new Error("--base and --head are required unless --files is provided");
  return execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRT", base, head], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
}

function workingTreeFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRT", "HEAD"], { encoding: "utf8" });
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" });
  return `${tracked}\n${untracked}`.split(/\r?\n/).filter(Boolean);
}

function parseArgs(values) {
  const parsed = { check: false, markdown: false, notApplicable: {} };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--check") parsed.check = true;
    else if (value === "--working-tree") parsed.workingTree = true;
    else if (value === "--markdown") parsed.markdown = true;
    else if (value === "--not-applicable") {
      const [id, ...reason] = String(values[++index] ?? "").split("=");
      if (!id || !reason.join("=").trim()) throw new Error("--not-applicable requires <requirement-id>=<reason>");
      parsed.notApplicable[id] = reason.join("=").trim();
    }
    else if (["--base", "--head", "--files", "--change-id", "--title", "--owner", "--checkpoint", "--json-output", "--markdown-output", "--output-dir", "--not-applicable-file"].includes(value)) parsed[toKey(value)] = values[++index];
    else throw new Error(`Unsupported option ${value}`);
  }
  return parsed;
}

async function readNotApplicable(target, checkpoint) {
  const resolved = path.resolve(target);
  let report;
  try {
    report = JSON.parse(await readFile(resolved, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read --not-applicable-file ${target}: ${error.message}`);
  }
  if (report?.schemaVersion !== 2 || !Array.isArray(report.requirements)) {
    throw new Error("--not-applicable-file must be a schemaVersion 2 documentation impact report");
  }
  if (checkpoint && report.checkpoint !== checkpoint) {
    throw new Error(`--not-applicable-file checkpoint ${report.checkpoint ?? "missing"} does not match ${checkpoint}`);
  }
  const rationales = {};
  for (const requirement of report.requirements) {
    if (requirement?.status !== "not-applicable") continue;
    if (typeof requirement.id !== "string" || typeof requirement.rationale !== "string" || !requirement.rationale.trim()) {
      throw new Error("--not-applicable-file contains an invalid not-applicable requirement");
    }
    rationales[requirement.id] = requirement.rationale.trim();
  }
  return rationales;
}

function toKey(value) { return value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
async function writeOutput(target, contents) { const resolved = path.resolve(target); await mkdir(path.dirname(resolved), { recursive: true }); await writeFile(resolved, contents, "utf8"); }
