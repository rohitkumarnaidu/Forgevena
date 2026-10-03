import { access, readFile } from "node:fs/promises";
import path from "node:path";

export const STABLE_RELEASE_PROVIDERS = Object.freeze(["openai", "claude", "gemini", "openrouter", "ollama"]);
export const STABLE_RELEASE_MATRIX = Object.freeze(["ubuntu-latest:20", "ubuntu-latest:22", "windows-latest:20", "windows-latest:22", "macos-15-intel:20", "macos-15-intel:22"]);
export const STABLE_RELEASE_SCENARIOS = Object.freeze(["clean-install", "upgrade-migration", "rollback", "offline-install", "cancellation", "uninstall", "workspace-preservation"]);

export async function verifyStableReleaseGate(root, { now = new Date() } = {}) {
  const evidencePath = path.join(root, "docs/evidence/releases/v1.4.0/stable-release-readiness.json");
  let evidence;
  try { evidence = JSON.parse(await readFile(evidencePath, "utf8")); }
  catch (error) { return { valid: false, decision: "hold", issues: [`Cannot read stable release evidence: ${error.message}`] }; }
  const issues = [];
  if (evidence.schemaVersion !== 1 || evidence.version !== "1.4.0" || !/^v1\.4\.0-rc\.\d+$/.test(evidence.candidateTag ?? "")) issues.push("Stable readiness metadata does not identify v1.4.0 and an immutable 1.4.0 RC candidate.");
  try {
    const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    if (manifest.version !== "1.4.0") issues.push("The reviewed stable promotion commit must set package.json to exactly 1.4.0 before the v1.4.0 tag is created.");
  } catch (error) { issues.push(`Cannot verify stable package version: ${error.message}`); }
  if (evidence.decision !== "ready") issues.push("Stable readiness decision is not ready.");
  if (!Array.isArray(evidence.blockers) || evidence.blockers.length) issues.push("Stable readiness has unresolved blockers.");

  const providers = Array.isArray(evidence.providerEvidence) ? evidence.providerEvidence : [];
  if (providers.length !== STABLE_RELEASE_PROVIDERS.length || new Set(providers.map(({ provider }) => provider)).size !== STABLE_RELEASE_PROVIDERS.length || STABLE_RELEASE_PROVIDERS.some((provider) => !providers.some((entry) => entry.provider === provider))) {
    issues.push("Provider evidence must contain exactly one record for every committed provider.");
  }
  for (const item of providers) {
    if (item.status !== "passed") issues.push(`${item.provider}: live provider evidence has not passed.`);
    if (!item.model || !isDate(item.verifiedAt) || !isDate(item.expiresAt)) issues.push(`${item.provider}: model and dated compatibility evidence are required.`);
    const verified = Date.parse(item.verifiedAt ?? "");
    const expires = Date.parse(item.expiresAt ?? "");
    const ttl = item.provider === "ollama" ? 180 : 90;
    if (!Number.isFinite(verified) || !Number.isFinite(expires) || verified > now.getTime() || expires <= now.getTime() || expires - verified > ttl * 86400000) issues.push(`${item.provider}: compatibility evidence is missing, future-dated, expired, or exceeds its freshness limit.`);
    if (!(await evidenceFileExists(root, item.evidencePath))) issues.push(`${item.provider}: sanitized evidence file is missing or outside docs/evidence.`);
    if (!Array.isArray(item.limitations)) issues.push(`${item.provider}: evidence limitations must be explicit.`);
  }

  const rehearsal = evidence.preTagRehearsal ?? {};
  if (rehearsal.status !== "passed" || rehearsal.candidateTag !== evidence.candidateTag) issues.push("The exact published candidate artifact has not passed the pre-tag rehearsal.");
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/[0-9]+$/.test(rehearsal.workflowRunUrl ?? "") || !Number.isInteger(rehearsal.workflowRunId) || !/^[a-f0-9]{40}$/.test(rehearsal.commit ?? "") || !isDate(rehearsal.completedAt)) issues.push("A successful hosted pre-tag workflow run, source commit, and completion timestamp must be retained.");
  const matrix = Array.isArray(rehearsal.matrix) ? rehearsal.matrix : [];
  const actualMatrix = matrix.map(({ os, node }) => `${os}:${node}`);
  if (actualMatrix.length !== STABLE_RELEASE_MATRIX.length || new Set(actualMatrix).size !== STABLE_RELEASE_MATRIX.length || STABLE_RELEASE_MATRIX.some((entry) => !actualMatrix.includes(entry))) issues.push("The pre-tag rehearsal must cover Windows, Linux, and macOS on Node.js 20 and 22 exactly once.");
  const verifiedHashes = new Set();
  for (const item of matrix) {
    if (item.status !== "passed" || !(await evidenceFileExists(root, item.evidencePath))) issues.push(`${item.os} / Node ${item.node}: lifecycle evidence is not passing and retained.`);
    else {
      try {
        const result = JSON.parse(await readFile(path.join(root, item.evidencePath), "utf8"));
        const scenariosPassed = STABLE_RELEASE_SCENARIOS.every((name) => result.scenarios?.includes(name));
        if (result.schemaVersion !== 1 || result.candidateTag !== evidence.candidateTag || result.os !== item.os || result.node !== item.node || result.status !== "passed" || result.checksumVerified !== true || !/^[a-f0-9]{64}$/.test(result.artifactSha256 ?? "") || result.baselineVersion !== "1.3.0" || result.candidateVersion !== evidence.candidateTag.slice(1) || result.offlineVersion !== evidence.candidateTag.slice(1) || result.workflowRunId !== rehearsal.workflowRunId || result.commit !== rehearsal.commit || result.secretsRetained !== false || !scenariosPassed) {
          issues.push(`${item.os} / Node ${item.node}: retained lifecycle artifact is malformed or does not prove the exact RC3 rehearsal.`);
        } else verifiedHashes.add(result.artifactSha256);
      } catch (error) { issues.push(`${item.os} / Node ${item.node}: cannot read lifecycle evidence (${error.message}).`); }
    }
  }
  if (verifiedHashes.size !== 1 || !verifiedHashes.has(rehearsal.artifactSha256)) issues.push("All matrix jobs must verify and retain the same published RC3 SHA-256.");
  const scenarios = Array.isArray(rehearsal.scenarios) ? rehearsal.scenarios : [];
  if (scenarios.length !== STABLE_RELEASE_SCENARIOS.length || new Set(scenarios.map(({ name }) => name)).size !== STABLE_RELEASE_SCENARIOS.length || STABLE_RELEASE_SCENARIOS.some((name) => !scenarios.some((entry) => entry.name === name))) issues.push("All required install, migration, rollback, offline, cancellation, uninstall, and preservation scenarios must be recorded.");
  for (const item of scenarios) if (item.status !== "passed" || !(await evidenceFileExists(root, item.evidencePath)) || !matrix.some((job) => job.evidencePath === item.evidencePath)) issues.push(`${item.name}: scenario evidence is not passing and linked to a matrix result.`);

  const quality = evidence.qualityGates ?? {};
  if (quality.criticalPercent < 100 || quality.importantPercent < 95 || quality.standardPercent < 90 || quality.blockerCount !== 0) issues.push("Tier-3 quality thresholds or zero-blocker requirement are not met.");
  if (!(await evidenceFileExists(root, quality.scorecardPath))) issues.push("A completed release scorecard is not retained under docs/evidence.");
  else {
    try {
      const scorecard = await readFile(path.join(root, quality.scorecardPath), "utf8");
      if (!/\*\*Decision:\s*READY\*\*/i.test(scorecard) || !new RegExp(`critical controls[^\\n]*${quality.criticalPercent}%`, "i").test(scorecard) || !new RegExp(`important controls[^\\n]*${quality.importantPercent}%`, "i").test(scorecard) || !new RegExp(`standard controls[^\\n]*${quality.standardPercent}%`, "i").test(scorecard) || !/outstanding mandatory blockers:\s*0\b/i.test(scorecard)) issues.push("The release scorecard document does not confirm the ready decision and machine-recorded thresholds.");
    } catch (error) { issues.push(`Cannot read release scorecard: ${error.message}`); }
  }
  const approval = evidence.approval ?? {};
  if (approval.ownerApproved !== true || !approval.approver || !isDate(approval.approvedAt) || !approval.reviewRecord) issues.push("Explicit owner release approval and its review record are missing.");

  return { valid: issues.length === 0, decision: issues.length ? "hold" : "ready", candidateTag: evidence.candidateTag, providersChecked: providers.length, matrixJobs: matrix.length, issues };
}

export async function runStableReleaseGate(root, { allowHold = false, now } = {}) {
  const result = await verifyStableReleaseGate(root, { now });
  return { ...result, accepted: result.valid || allowHold };
}

async function evidenceFileExists(root, relativePath) {
  if (typeof relativePath !== "string" || !relativePath.startsWith("docs/evidence/") || relativePath.includes("..") || path.isAbsolute(relativePath)) return false;
  try { await access(path.join(root, relativePath)); return true; } catch { return false; }
}

function isDate(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
