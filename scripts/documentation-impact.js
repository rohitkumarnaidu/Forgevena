import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeDocumentationImpact, renderDocumentationImpactMarkdown, validateDocumentationImpactReport } from "../src/documentation-impact.js";
import { writeDocumentationEvidenceBundle } from "../src/documentation-evidence.js";

const args = parseArgs(process.argv.slice(2));
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
  notApplicable: args.notApplicable,
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
    else if (["--base", "--head", "--files", "--change-id", "--title", "--owner", "--checkpoint", "--json-output", "--markdown-output", "--output-dir"].includes(value)) parsed[toKey(value)] = values[++index];
    else throw new Error(`Unsupported option ${value}`);
  }
  return parsed;
}

function toKey(value) { return value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
async function writeOutput(target, contents) { const resolved = path.resolve(target); await mkdir(path.dirname(resolved), { recursive: true }); await writeFile(resolved, contents, "utf8"); }
