const CONTROL_DEFINITIONS = Object.freeze([
  { id: "source-integrity", weight: 15 },
  { id: "release-automation", weight: 15 },
  { id: "security-quality", weight: 15 },
  { id: "documentation", weight: 10 },
  { id: "migration-rollback", weight: 10 },
  { id: "distribution", weight: 15 },
  { id: "post-release-verification", weight: 10 },
  { id: "current-governance-evidence", weight: 10 },
]);

const CONTROL_STATUSES = ["pass", "partial", "fail", "unknown", "not-applicable"];
const OUTCOMES = ["published", "failed-publication", "superseded"];
const DECISIONS = ["current-certified", "historical-assurance", "failed-as-recorded", "not-certified"];

export function calculateReleaseRetrospective(release) {
  const controls = Array.isArray(release?.controls) ? release.controls : [];
  const active = controls.filter(({ status }) => status !== "not-applicable");
  const applicablePoints = active.reduce((total, control) => total + control.weight, 0);
  const earnedPoints = active.reduce((total, control) => total + (control.status === "pass" ? control.weight : control.status === "partial" ? control.weight / 2 : 0), 0);
  const score = applicablePoints ? Math.floor((earnedPoints / applicablePoints) * 100) : 0;
  const mandatoryFailures = active.filter((control) => control.mandatory && control.status !== "pass").map(({ id }) => id);
  return { applicablePoints, earnedPoints, score, mandatoryFailures };
}

export function validateReleaseRetrospectives(document) {
  const issues = [];
  if (!document || typeof document !== "object" || Array.isArray(document)) return result(["Release retrospective ledger must be an object."], 0);
  if (document.schemaVersion !== 1) issues.push("schemaVersion must be 1.");
  if (!/^\d+\.\d+\.\d+$/.test(document.policyEffectiveFrom ?? "")) issues.push("policyEffectiveFrom must be a stable semantic version.");
  if (!validDate(document.assessedAt)) issues.push("assessedAt must be a valid date-time.");
  if (!nonEmpty(document.owner)) issues.push("owner is required.");
  if (!Array.isArray(document.expectedStableTags) || document.expectedStableTags.length === 0) issues.push("expectedStableTags must be a non-empty array.");
  if (!Array.isArray(document.releases) || document.releases.length === 0) return result([...issues, "releases must be a non-empty array."], 0);

  const expected = new Set(document.expectedStableTags ?? []);
  const seen = new Set();
  for (const release of document.releases) {
    validateRelease(release, document.policyEffectiveFrom, issues);
    if (seen.has(release?.tag)) issues.push(`Release ${release.tag} is duplicated.`);
    seen.add(release?.tag);
  }
  for (const tag of expected) if (!seen.has(tag)) issues.push(`Expected stable tag ${tag} has no retrospective assessment.`);
  for (const tag of seen) if (!expected.has(tag)) issues.push(`Retrospective release ${tag} is missing from expectedStableTags.`);
  return result(issues, document.releases.length);
}

export function renderReleaseRetrospective(document) {
  const rows = document.releases.map((release) => {
    const calculated = calculateReleaseRetrospective(release);
    return `| \`${release.tag}\` | ${release.outcome} | ${calculated.score}% | ${release.decision} | ${release.summary} |`;
  }).join("\n");
  const gaps = document.releases.flatMap((release) => release.findings.map((finding) => `- **${release.tag}:** ${finding}`)).join("\n");
  return `# Historical Release Governance Retrospective\n\n> **Assessment date:** ${document.assessedAt}\n>\n> **Policy effective from:** v${document.policyEffectiveFrom}\n>\n> This report evaluates retained evidence without rewriting history. A historical score is not a claim that a release passed rules that did not yet exist.\n\n## Decision Semantics\n\n- **current-certified:** Released after the policy effective version with complete retained current-rule evidence.\n- **historical-assurance:** Published successfully with meaningful historical evidence, but not certified under the later governance contract.\n- **failed-as-recorded:** The immutable tag or publication attempt failed and is retained as evidence.\n- **not-certified:** Available evidence is insufficient for either current certification or historical assurance.\n\n## Release Matrix\n\n| Release | Outcome | Retrospective score | Decision | Assessment |\n| --- | --- | ---: | --- | --- |\n${rows}\n\n## Findings and Improvement Input\n\n${gaps || "No unresolved retrospective findings."}\n\n## Binding Rule\n\nReleases before v${document.policyEffectiveFrom} are never silently upgraded to current-certified. Releases at or after v${document.policyEffectiveFrom} must retain a release-checkpoint scorecard, documentation evidence bundle, channel verification, migration and rollback evidence, and post-release review before they may be marked current-certified.\n`;
}

function validateRelease(release, effectiveFrom, issues) {
  if (!release || typeof release !== "object") return issues.push("Every release retrospective must be an object.");
  if (!/^v\d+\.\d+\.\d+$/.test(release.tag ?? "")) issues.push(`Release ${release.tag ?? "<unknown>"} must use a stable vX.Y.Z tag.`);
  if (!nonEmpty(release.commit) || !/^[0-9a-f]{40}$/i.test(release.commit)) issues.push(`Release ${release.tag ?? "<unknown>"} requires a full commit SHA.`);
  if (!OUTCOMES.includes(release.outcome)) issues.push(`Release ${release.tag ?? "<unknown>"} has unsupported outcome ${release.outcome}.`);
  if (!DECISIONS.includes(release.decision)) issues.push(`Release ${release.tag ?? "<unknown>"} has unsupported decision ${release.decision}.`);
  if (!nonEmpty(release.summary)) issues.push(`Release ${release.tag ?? "<unknown>"} requires a summary.`);
  if (!Array.isArray(release.findings)) issues.push(`Release ${release.tag ?? "<unknown>"} findings must be an array.`);
  if (!Array.isArray(release.controls) || release.controls.length !== CONTROL_DEFINITIONS.length) return issues.push(`Release ${release.tag ?? "<unknown>"} must define exactly ${CONTROL_DEFINITIONS.length} controls.`);
  const seen = new Set();
  for (const control of release.controls) {
    if (seen.has(control?.id)) issues.push(`Release ${release.tag} duplicates control ${control?.id ?? "<unknown>"}.`);
    seen.add(control?.id);
  }
  for (const definition of CONTROL_DEFINITIONS) {
    const control = release.controls.find(({ id }) => id === definition.id);
    if (!control) { issues.push(`Release ${release.tag} is missing control ${definition.id}.`); continue; }
    if (control.weight !== definition.weight) issues.push(`Release ${release.tag} control ${control.id} must have weight ${definition.weight}.`);
    if (!CONTROL_STATUSES.includes(control.status)) issues.push(`Release ${release.tag} control ${control.id} has unsupported status ${control.status}.`);
    if (typeof control.mandatory !== "boolean") issues.push(`Release ${release.tag} control ${control.id} mandatory must be boolean.`);
    if (!nonEmpty(control.rationale)) issues.push(`Release ${release.tag} control ${control.id} requires a rationale.`);
    if (["pass", "partial", "fail"].includes(control.status) && (!Array.isArray(control.evidence) || control.evidence.length === 0)) issues.push(`Release ${release.tag} control ${control.id} requires evidence for ${control.status}.`);
    if (["unknown", "not-applicable"].includes(control.status) && !nonEmpty(control.rationale)) issues.push(`Release ${release.tag} control ${control.id} requires an explicit rationale.`);
  }
  const calculated = calculateReleaseRetrospective(release);
  for (const field of ["applicablePoints", "earnedPoints", "score"]) if (release.totals?.[field] !== calculated[field]) issues.push(`Release ${release.tag} totals.${field} must equal ${calculated[field]}.`);
  if (JSON.stringify(release.totals?.mandatoryFailures ?? []) !== JSON.stringify(calculated.mandatoryFailures)) issues.push(`Release ${release.tag} totals.mandatoryFailures must match calculated failures.`);
  const version = release.tag?.slice(1);
  const governed = compareVersions(version, effectiveFrom) >= 0;
  const currentEvidence = release.controls.find(({ id }) => id === "current-governance-evidence");
  if (governed && release.decision !== "current-certified") issues.push(`Release ${release.tag} is at or after the policy effective version and must be current-certified.`);
  if (release.decision === "current-certified" && (calculated.score !== 100 || calculated.mandatoryFailures.length || currentEvidence?.status !== "pass")) issues.push(`Release ${release.tag} cannot be current-certified without 100% evidence and no mandatory failures.`);
  if (release.outcome === "failed-publication" && release.decision !== "failed-as-recorded") issues.push(`Failed publication ${release.tag} must use failed-as-recorded.`);
  if (release.outcome === "published" && release.decision === "failed-as-recorded") issues.push(`Published release ${release.tag} cannot use failed-as-recorded.`);
}

function compareVersions(left, right) {
  const a = String(left).split(".").map(Number);
  const b = String(right).split(".").map(Number);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
}

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function validDate(value) { return typeof value === "string" && !Number.isNaN(new Date(value).valueOf()); }
function result(issues, releasesChecked) { return { valid: issues.length === 0, issues, releasesChecked }; }
