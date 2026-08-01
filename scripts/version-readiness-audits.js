#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AUDITED_VERSIONS, renderAuditMarkdown, renderComparisonMarkdown, renderDependencyMapMarkdown,
  renderOwnershipMatrixMarkdown, bootstrapVersionReadinessAudits, normalizeGeneratedMarkdown,
  validateVersionReadinessAudits, writeVersionReadinessReports,
} from "../src/version-readiness-audit.js";

const root = process.cwd();
const options = parseOptions(process.argv.slice(2));
const versions = options.version ? [options.version] : AUDITED_VERSIONS;
if (options.apply) await bootstrapVersionReadinessAudits(root);
const validation = await validateVersionReadinessAudits(root, { versions });
if (!validation.valid) fail(validation.issues);

if (options.apply) {
  await writeVersionReadinessReports(root, validation.audits, { comparison: options.comparison && !options.version });
  if (options.remediation) await runRemediation(options);
  console.log(JSON.stringify({ valid: true, mode: "write", versions: validation.audits.length, comparison: options.comparison && !options.version, remediation: options.remediation }, null, 2));
} else {
  const issues = await verifyGenerated(root, validation.audits, options);
  console.log(JSON.stringify({ valid: issues.length === 0, mode: "verify", versions: validation.audits.length, issues }, null, 2));
  if (issues.length) process.exitCode = 1;
}

function parseOptions(args) {
  const result = { apply: false, comparison: true, remediation: false, version: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") result.apply = true;
    else if (arg === "--verify" || arg === "--all") continue;
    else if (arg === "--comparison") result.comparison = true;
    else if (arg === "--remediation") result.remediation = true;
    else if (arg === "--version") result.version = args[++index];
    else throw new Error(`Unsupported option ${arg}.`);
  }
  if (result.version && !AUDITED_VERSIONS.includes(result.version)) throw new Error(`Unknown future version ${result.version}.`);
  return result;
}

async function verifyGenerated(rootDir, audits, options) {
  const issues = [];
  for (const audit of audits) {
    const relative = `docs/evidence/changes/version-readiness-audit-${audit.auditedVersion}/audit.md`;
    const actual = await readFile(path.join(rootDir, relative), "utf8").catch(() => "");
    if (normalizeGeneratedMarkdown(actual) !== renderAuditMarkdown(audit)) issues.push(`${relative} is missing or stale.`);
  }
  if (options.comparison && !options.version) {
    const reports = [
      ["docs/reports/VERSION_IMPLEMENTATION_READINESS_COMPARISON.md", renderComparisonMarkdown(audits)],
      ["docs/reports/VERSION_READINESS_DEPENDENCY_MAP.md", renderDependencyMapMarkdown(audits)],
      ["docs/reports/VERSION_READINESS_BLOCKER_OWNERSHIP_MATRIX.md", renderOwnershipMatrixMarkdown(audits)],
    ];
    for (const [relative, expected] of reports) {
      const actual = await readFile(path.join(rootDir, relative), "utf8").catch(() => "");
      if (normalizeGeneratedMarkdown(actual) !== normalizeGeneratedMarkdown(expected)) issues.push(`${relative} is missing or stale.`);
    }
  }
  if (options.remediation) await runRemediation(options);
  return issues;
}

async function runRemediation(options) {
  const { spawnSync } = await import("node:child_process");
  const args = [path.join(root, "scripts", "version-readiness-remediation.js"), options.apply ? "--apply" : "--verify"];
  if (options.version) args.push("--version", options.version); else args.push("--all");
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}

function fail(issues) { console.error(issues.join("\n")); process.exit(1); }
