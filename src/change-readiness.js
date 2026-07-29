const STATUSES = ["pass", "partial", "fail", "not-applicable"];
const CHECKPOINTS = ["push", "merge", "release"];
const RISKS = ["tier-0", "tier-1", "tier-2", "tier-3"];
const DECISIONS = ["ready", "hold", "reject"];
const MATURITY = ["experimental", "preview", "stable", "enterprise-certified", "deprecated"];

export const CATEGORY_DEFINITIONS = Object.freeze([
  ["product-governance", 6],
  ["architecture-system-design", 8],
  ["code-quality-maintainability", 8],
  ["security-privacy-trust", 10],
  ["testing-quality-assurance", 12],
  ["reliability-recovery-rollback", 8],
  ["performance-scalability-cost", 6],
  ["api-contracts-data", 6],
  ["frontend-uiux-accessibility", 6],
  ["backend-integrations-concurrency", 6],
  ["devops-supply-chain", 8],
  ["documentation-developer-experience", 6],
  ["compatibility-versioning-release", 6],
  ["observability-support-sustainability", 4],
].map(([id, weight]) => Object.freeze({ id, weight })));

export const BLOCKER_DEFINITIONS = Object.freeze([
  "B-01", "B-02", "B-03", "B-04", "B-05", "B-06",
  "B-07", "B-08", "B-09", "B-10", "B-11", "B-12",
]);

export const THRESHOLDS = Object.freeze({
  "tier-0": Object.freeze({ push: 80, merge: 85, release: null, minimumDomainScore: 70 }),
  "tier-1": Object.freeze({ push: 85, merge: 90, release: 90, minimumDomainScore: 70 }),
  "tier-2": Object.freeze({ push: 90, merge: 95, release: 95, minimumDomainScore: 80 }),
  "tier-3": Object.freeze({ push: 90, merge: 95, release: 95, minimumDomainScore: 80 }),
});

export const MODULE_CRITICALITY_THRESHOLDS = Object.freeze({
  standard: 90,
  important: 95,
  critical: 100,
});

export const PROFILE_EXPECTATIONS = Object.freeze({
  "documentation-content": ["product-governance", "architecture-system-design", "security-privacy-trust", "testing-quality-assurance", "api-contracts-data", "frontend-uiux-accessibility", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "standard-code": ["product-governance", "architecture-system-design", "code-quality-maintainability", "security-privacy-trust", "testing-quality-assurance", "reliability-recovery-rollback", "performance-scalability-cost", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "frontend-uiux": ["product-governance", "architecture-system-design", "code-quality-maintainability", "security-privacy-trust", "testing-quality-assurance", "reliability-recovery-rollback", "performance-scalability-cost", "api-contracts-data", "frontend-uiux-accessibility", "devops-supply-chain", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "backend-api-data": ["product-governance", "architecture-system-design", "code-quality-maintainability", "security-privacy-trust", "testing-quality-assurance", "reliability-recovery-rollback", "performance-scalability-cost", "api-contracts-data", "backend-integrations-concurrency", "devops-supply-chain", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "platform-devops": ["product-governance", "architecture-system-design", "code-quality-maintainability", "security-privacy-trust", "testing-quality-assurance", "reliability-recovery-rollback", "performance-scalability-cost", "backend-integrations-concurrency", "devops-supply-chain", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "security-trust": CATEGORY_DEFINITIONS.map(({ id }) => id),
  "registry-ecosystem": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "release-version": ["product-governance", "architecture-system-design", "security-privacy-trust", "testing-quality-assurance", "reliability-recovery-rollback", "performance-scalability-cost", "devops-supply-chain", "documentation-developer-experience", "compatibility-versioning-release", "observability-support-sustainability"],
  "capability-package": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "host-adapter-portability": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "agent-team-runtime": CATEGORY_DEFINITIONS.map(({ id }) => id),
  "orchestration-automation": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "rule-guardrail-package": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "knowledge-memory-capability": CATEGORY_DEFINITIONS.map(({ id }) => id).filter((id) => id !== "frontend-uiux-accessibility"),
  "capability-builder-publisher": CATEGORY_DEFINITIONS.map(({ id }) => id),
  "marketplace-registry-distribution": CATEGORY_DEFINITIONS.map(({ id }) => id),
});

export const PROFILE_DOMAIN_THRESHOLDS = Object.freeze({
  "documentation-content": Object.freeze({ "product-governance": 100, "architecture-system-design": 95, "security-privacy-trust": 100, "testing-quality-assurance": 90, "api-contracts-data": 95, "frontend-uiux-accessibility": 95, "documentation-developer-experience": 90, "compatibility-versioning-release": 100, "observability-support-sustainability": 95 }),
  "standard-code": Object.freeze({ "product-governance": 90, "architecture-system-design": 90, "code-quality-maintainability": 90, "security-privacy-trust": 100, "testing-quality-assurance": 95, "reliability-recovery-rollback": 95, "performance-scalability-cost": 90, "api-contracts-data": 95, "frontend-uiux-accessibility": 95, "backend-integrations-concurrency": 95, "devops-supply-chain": 95, "documentation-developer-experience": 95, "compatibility-versioning-release": 95, "observability-support-sustainability": 90 }),
  "frontend-uiux": Object.freeze({ "product-governance": 90, "architecture-system-design": 90, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 95, "reliability-recovery-rollback": 95, "performance-scalability-cost": 95, "api-contracts-data": 95, "frontend-uiux-accessibility": 100, "backend-integrations-concurrency": 90, "devops-supply-chain": 95, "documentation-developer-experience": 95, "compatibility-versioning-release": 95, "observability-support-sustainability": 90 }),
  "backend-api-data": Object.freeze({ "product-governance": 90, "architecture-system-design": 95, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "frontend-uiux-accessibility": 90, "backend-integrations-concurrency": 100, "devops-supply-chain": 95, "documentation-developer-experience": 95, "compatibility-versioning-release": 100, "observability-support-sustainability": 95 }),
  "platform-devops": Object.freeze({ "product-governance": 90, "architecture-system-design": 95, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 95, "frontend-uiux-accessibility": 90, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 95, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "security-trust": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "frontend-uiux-accessibility": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "registry-ecosystem": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "frontend-uiux-accessibility": 90, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 95, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "release-version": Object.freeze({ "product-governance": 100, "architecture-system-design": 95, "code-quality-maintainability": 90, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 95, "frontend-uiux-accessibility": 95, "backend-integrations-concurrency": 95, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "capability-package": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "backend-integrations-concurrency": 95, "devops-supply-chain": 100, "documentation-developer-experience": 95, "compatibility-versioning-release": 100, "observability-support-sustainability": 95 }),
  "host-adapter-portability": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 95, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 95 }),
  "agent-team-runtime": Object.freeze({ "product-governance": 100, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 100, "api-contracts-data": 100, "frontend-uiux-accessibility": 95, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "orchestration-automation": Object.freeze({ "product-governance": 100, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 100, "api-contracts-data": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 95, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "rule-guardrail-package": Object.freeze({ "product-governance": 100, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "knowledge-memory-capability": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 95, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
  "capability-builder-publisher": Object.freeze({ "product-governance": 95, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "frontend-uiux-accessibility": 100, "backend-integrations-concurrency": 95, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 95 }),
  "marketplace-registry-distribution": Object.freeze({ "product-governance": 100, "architecture-system-design": 100, "code-quality-maintainability": 95, "security-privacy-trust": 100, "testing-quality-assurance": 100, "reliability-recovery-rollback": 100, "performance-scalability-cost": 95, "api-contracts-data": 100, "frontend-uiux-accessibility": 100, "backend-integrations-concurrency": 100, "devops-supply-chain": 100, "documentation-developer-experience": 100, "compatibility-versioning-release": 100, "observability-support-sustainability": 100 }),
});

export function calculateChangeReadiness(document) {
  const categories = Array.isArray(document?.categories) ? document.categories.map((category) => calculateCategory(category, requiredDomainScore(document, category?.id))) : [];
  const moduleAssessments = calculateModuleAssessments(document);
  const applicablePoints = sum(categories.map((category) => category.applicablePoints));
  const earnedPoints = sum(categories.map((category) => category.earnedScore));
  const score = applicablePoints > 0 ? Math.floor((earnedPoints / applicablePoints) * 100) : 0;
  const threshold = THRESHOLDS[document?.riskTier]?.[document?.checkpoint] ?? null;
  const minimumDomainScore = THRESHOLDS[document?.riskTier]?.minimumDomainScore ?? null;
  const qualityBand = score >= 95 ? "enterprise-ready" : score >= 90 ? "production-ready" : score >= 85 ? "controlled-low-risk" : "not-ready";
  const failedDomains = categories.filter((category) => category.status !== "not-applicable" && category.scorePercent < category.requiredScore).map(({ id }) => id);
  const failedModules = moduleAssessments.filter(({ status }) => status === "fail").map(({ component }) => component);
  return { categories, moduleAssessments, maximumWeight: 100, applicablePoints, earnedPoints, score, qualityBand, threshold, minimumDomainScore, domainGateSatisfied: failedDomains.length === 0, moduleGateSatisfied: failedModules.length === 0, failedDomains, failedModules };
}

export function validateChangeReadinessScorecard(document, { now = new Date() } = {}) {
  const issues = [];
  if (!document || typeof document !== "object" || Array.isArray(document)) return report(["Scorecard must be a JSON object."], null);
  requireValue(issues, document.schemaVersion === 2, "schemaVersion must be 2.");
  for (const field of ["changeId", "title", "owner", "version", "scope"]) requireValue(issues, nonEmpty(document[field]), `${field} is required.`);
  requireEnum(issues, document.changeType, ["feature", "fix", "refactor", "documentation", "architecture", "registry", "marketplace", "release", "other"], "changeType");
  requireEnum(issues, document.profile, Object.keys(PROFILE_EXPECTATIONS), "profile");
  requireEnum(issues, document.riskTier, RISKS, "riskTier");
  requireEnum(issues, document.checkpoint, CHECKPOINTS, "checkpoint");
  requireEnum(issues, document.maturity, MATURITY, "maturity");
  for (const field of ["affectedComponents", "requirements", "nonGoals", "evidenceLinks"]) requireNonEmptyStrings(issues, document[field], field);
  if (document.riskTier === "tier-0" && document.checkpoint === "release") issues.push("tier-0 changes do not have a release checkpoint.");

  validateCategories(document, issues);
  validateModuleAssessments(document, issues);
  validateBlockers(document.blockers, issues);
  validateAssessments(document.assessments, issues);
  validateWaivers(document.waivers, now, issues);
  validateDecision(document.decision, issues);
  validateTimestamps(document.timestamps, issues);

  const calculated = calculateChangeReadiness(document);
  validateStoredCalculations(document, calculated, issues);
  const mandatoryFailures = calculated.categories.flatMap((category) => category.items).filter((item) => item.mandatory && item.status !== "pass" && item.status !== "not-applicable");
  const triggeredBlockers = Array.isArray(document.blockers) ? document.blockers.filter((blocker) => blocker?.status === "triggered") : [];
  const expiredWaivers = Array.isArray(document.waivers) ? document.waivers.filter((waiver) => validDate(waiver.expiresAt) && new Date(waiver.expiresAt) <= now) : [];
  const gateSatisfied = calculated.threshold !== null && calculated.score >= calculated.threshold && calculated.domainGateSatisfied && calculated.moduleGateSatisfied && mandatoryFailures.length === 0 && triggeredBlockers.length === 0 && expiredWaivers.length === 0;
  if (document.decision?.status === "ready" && !gateSatisfied) issues.push("Decision cannot be ready because the selected checkpoint gate is not satisfied.");
  if (document.decision?.status === "ready" && (!Array.isArray(document.decision.approvedBy) || document.decision.approvedBy.length === 0)) issues.push("A ready decision requires at least one approver.");
  return report(issues, { ...calculated, gateSatisfied, lowDomains: calculated.failedDomains, mandatoryFailures: mandatoryFailures.map(({ id }) => id), triggeredBlockers: triggeredBlockers.map(({ id }) => id) });
}

function validateModuleAssessments(document, issues) {
  if (!Array.isArray(document.moduleAssessments) || document.moduleAssessments.length !== document.affectedComponents?.length) return issues.push("moduleAssessments must contain exactly one record for every affected component.");
  const seen = new Set();
  for (const assessment of document.moduleAssessments) {
    if (!assessment || typeof assessment !== "object") { issues.push("Every module assessment must be an object."); continue; }
    requireValue(issues, document.affectedComponents.includes(assessment.component), `Module assessment ${assessment.component ?? "<unknown>"} must reference an affected component.`);
    if (seen.has(assessment.component)) issues.push(`Module assessment ${assessment.component} is duplicated.`);
    seen.add(assessment.component);
    requireEnum(issues, assessment.criticality, Object.keys(MODULE_CRITICALITY_THRESHOLDS), `Module ${assessment.component} criticality`);
    requireEnum(issues, assessment.status, ["pass", "fail"], `Module ${assessment.component} status`);
    requireValue(issues, nonEmpty(assessment.rationale), `Module ${assessment.component} rationale is required.`);
    requireNonEmptyStrings(issues, assessment.evidence, `Module ${assessment.component} evidence`);
    if (!Array.isArray(assessment.criteria) || assessment.criteria.length === 0) issues.push(`Module ${assessment.component} must contain acceptance criteria.`);
    else {
      if (sum(assessment.criteria.map((criterion) => Number(criterion?.points) || 0)) !== 100) issues.push(`Module ${assessment.component} criteria points must total 100.`);
      for (const criterion of assessment.criteria) validateModuleCriterion(assessment.component, criterion, issues);
    }
    const derived = calculateModuleAssessment(document, assessment);
    if (assessment.requiredScore !== derived.requiredScore) issues.push(`Module ${assessment.component} requiredScore must equal calculated value ${derived.requiredScore}.`);
    for (const field of ["applicablePoints", "earnedScore", "score"]) if (assessment[field] !== derived[field]) issues.push(`Module ${assessment.component} ${field} must equal calculated value ${derived[field]}.`);
    if (assessment.status !== derived.status) issues.push(`Module ${assessment.component} status must equal calculated value ${derived.status}.`);
  }
  if (["tier-2", "tier-3"].includes(document.riskTier) && document.moduleAssessments.some((assessment) => assessment?.criticality === "standard")) issues.push(`${document.riskTier} changes cannot classify affected modules as standard.`);
  if ((document.riskTier === "tier-3" || ["security-trust", "registry-ecosystem", "release-version"].includes(document.profile)) && !document.moduleAssessments.some((assessment) => assessment?.criticality === "critical")) issues.push(`${document.profile} ${document.riskTier} readiness requires at least one critical module assessment.`);
}

function validateModuleCriterion(component, criterion, issues) {
  if (!criterion || typeof criterion !== "object") return issues.push(`Module ${component} contains an invalid criterion.`);
  for (const field of ["id", "description"]) requireValue(issues, nonEmpty(criterion[field]), `Module ${component} criterion ${field} is required.`);
  requireValue(issues, Number(criterion.points) > 0, `Module criterion ${criterion.id ?? "<unknown>"} points must be positive.`);
  requireValue(issues, typeof criterion.mandatory === "boolean", `Module criterion ${criterion.id ?? "<unknown>"} mandatory must be boolean.`);
  requireEnum(issues, criterion.status, STATUSES, `Module criterion ${criterion.id ?? "<unknown>"} status`);
  if (criterion.status === "not-applicable" && !nonEmpty(criterion.rationale)) issues.push(`Module criterion ${criterion.id} requires a not-applicable rationale.`);
  if (["pass", "partial"].includes(criterion.status) && (!Array.isArray(criterion.evidence) || criterion.evidence.length === 0)) issues.push(`Module criterion ${criterion.id} requires evidence for ${criterion.status}.`);
}

function validateCategories(document, issues) {
  if (!Array.isArray(document.categories) || document.categories.length !== CATEGORY_DEFINITIONS.length) return issues.push("categories must contain exactly 14 records.");
  const definitions = new Map(CATEGORY_DEFINITIONS.map((definition) => [definition.id, definition]));
  const seen = new Set();
  for (const category of document.categories) {
    if (!category || typeof category !== "object") { issues.push("Every category must be an object."); continue; }
    if (!definitions.has(category.id)) issues.push(`Unsupported category ${category.id ?? "<unknown>"}.`);
    if (seen.has(category.id)) issues.push(`Category ${category.id} is duplicated.`);
    seen.add(category.id);
    const expected = definitions.get(category.id);
    if (expected && category.weight !== expected.weight) issues.push(`Category ${category.id} must have weight ${expected.weight}.`);
    requireEnum(issues, category.status, STATUSES, `Category ${category.id} status`);
    if (!Array.isArray(category.items) || category.items.length === 0) { issues.push(`Category ${category.id} must contain score items.`); continue; }
    const itemPoints = sum(category.items.map((item) => Number(item?.points) || 0));
    if (expected && itemPoints !== expected.weight) issues.push(`Category ${category.id} item points must total ${expected.weight}.`);
    for (const item of category.items) validateItem(category.id, item, issues);
  }
  const expectedProfile = PROFILE_EXPECTATIONS[document.profile] ?? [];
  for (const id of expectedProfile) {
    const category = document.categories.find((candidate) => candidate?.id === id);
    if (category?.status === "not-applicable") issues.push(`Profile ${document.profile} requires category ${id} to be active.`);
  }
  if (sum(document.categories.map((category) => Number(category?.weight) || 0)) !== 100) issues.push("Category weights must total exactly 100.");
}

function validateItem(categoryId, item, issues) {
  if (!item || typeof item !== "object") return issues.push(`Category ${categoryId} contains an invalid item.`);
  for (const field of ["id", "description"]) requireValue(issues, nonEmpty(item[field]), `Category ${categoryId} item ${field} is required.`);
  requireValue(issues, Number(item.points) > 0, `Item ${item.id ?? "<unknown>"} points must be positive.`);
  requireValue(issues, typeof item.mandatory === "boolean", `Item ${item.id ?? "<unknown>"} mandatory must be boolean.`);
  requireEnum(issues, item.status, STATUSES, `Item ${item.id ?? "<unknown>"} status`);
  if (item.status === "not-applicable" && !nonEmpty(item.rationale)) issues.push(`Item ${item.id} requires a not-applicable rationale.`);
  if (["pass", "partial"].includes(item.status) && (!Array.isArray(item.evidence) || item.evidence.length === 0)) issues.push(`Item ${item.id} requires evidence for ${item.status}.`);
}

function validateBlockers(blockers, issues) {
  if (!Array.isArray(blockers) || blockers.length !== BLOCKER_DEFINITIONS.length) return issues.push("blockers must contain exactly 12 records.");
  const seen = new Set();
  for (const blocker of blockers) {
    if (!BLOCKER_DEFINITIONS.includes(blocker?.id)) issues.push(`Unsupported blocker ${blocker?.id ?? "<unknown>"}.`);
    if (seen.has(blocker?.id)) issues.push(`Blocker ${blocker.id} is duplicated.`);
    seen.add(blocker?.id);
    requireValue(issues, nonEmpty(blocker?.description), `Blocker ${blocker?.id ?? "<unknown>"} requires a description.`);
    requireEnum(issues, blocker?.status, ["clear", "triggered", "not-applicable"], `Blocker ${blocker?.id ?? "<unknown>"} status`);
    if (blocker?.status === "not-applicable" && !nonEmpty(blocker.rationale)) issues.push(`Blocker ${blocker.id} requires a not-applicable rationale.`);
    if (blocker?.status === "clear" && (!Array.isArray(blocker.evidence) || blocker.evidence.length === 0)) issues.push(`Blocker ${blocker.id} requires evidence when clear.`);
  }
}

function validateAssessments(assessments, issues) {
  if (!assessments || typeof assessments !== "object") return issues.push("assessments are required.");
  for (const field of ["tests", "security", "compatibility", "migration", "rollback", "documentation", "operations"]) requireNonEmptyStrings(issues, assessments[field], `assessments.${field}`);
}

function validateWaivers(waivers, now, issues) {
  if (!Array.isArray(waivers)) return issues.push("waivers must be an array.");
  for (const waiver of waivers) {
    for (const field of ["id", "owner", "requirement", "justification", "risk", "approvedBy", "createdAt", "expiresAt", "remediationIssue"]) requireValue(issues, nonEmpty(waiver?.[field]), `Waiver ${waiver?.id ?? "<unknown>"} is missing ${field}.`);
    requireNonEmptyStrings(issues, waiver?.compensatingControls, `Waiver ${waiver?.id ?? "<unknown>"}.compensatingControls`);
    if (!validDate(waiver?.createdAt) || !validDate(waiver?.expiresAt)) issues.push(`Waiver ${waiver?.id ?? "<unknown>"} has an invalid date.`);
    else if (new Date(waiver.expiresAt) <= now) issues.push(`Waiver ${waiver.id} expired on ${waiver.expiresAt}.`);
  }
}

function validateDecision(decision, issues) {
  if (!decision || typeof decision !== "object") return issues.push("decision is required.");
  requireEnum(issues, decision.status, DECISIONS, "decision.status");
  requireValue(issues, nonEmpty(decision.rationale), "decision.rationale is required.");
  if (!Array.isArray(decision.approvedBy) || decision.approvedBy.some((value) => !nonEmpty(value))) issues.push("decision.approvedBy must be an array of names.");
}

function validateTimestamps(timestamps, issues) {
  if (!timestamps || !validDate(timestamps.assessedAt)) issues.push("timestamps.assessedAt must be a valid date-time.");
  if (timestamps?.reviewedAt !== null && !validDate(timestamps?.reviewedAt)) issues.push("timestamps.reviewedAt must be null or a valid date-time.");
}

function validateStoredCalculations(document, calculated, issues) {
  for (const derived of calculated.categories) {
    const stored = document.categories?.find((category) => category?.id === derived.id);
    for (const field of ["status", "applicablePoints", "earnedScore", "scorePercent"]) if (stored?.[field] !== derived[field]) issues.push(`Category ${derived.id} ${field} must equal calculated value ${derived[field]}.`);
  }
  const stored = document.totals;
  if (!stored || typeof stored !== "object") return issues.push("totals are required.");
  for (const field of ["maximumWeight", "applicablePoints", "earnedPoints", "score", "qualityBand", "threshold", "minimumDomainScore", "domainGateSatisfied", "moduleGateSatisfied"]) if (stored[field] !== calculated[field]) issues.push(`totals.${field} must equal calculated value ${calculated[field]}.`);
}

function calculateCategory(category, requiredScore) {
  const items = Array.isArray(category?.items) ? category.items.map((item) => ({ ...item })) : [];
  const active = items.filter((item) => item.status !== "not-applicable");
  const applicablePoints = sum(active.map((item) => Number(item.points) || 0));
  const earnedScore = sum(active.map((item) => item.status === "pass" ? Number(item.points) || 0 : item.status === "partial" ? (Number(item.points) || 0) / 2 : 0));
  const scorePercent = applicablePoints > 0 ? Math.floor((earnedScore / applicablePoints) * 100) : 0;
  const status = active.length === 0 ? "not-applicable" : active.some((item) => item.status === "fail") ? "fail" : active.some((item) => item.status === "partial") ? "partial" : "pass";
  return { id: category?.id, status, applicablePoints, earnedScore, scorePercent, requiredScore, items };
}

function calculateModuleAssessments(document) {
  return Array.isArray(document?.moduleAssessments) ? document.moduleAssessments.map((assessment) => calculateModuleAssessment(document, assessment)) : [];
}

function calculateModuleAssessment(document, assessment) {
  const base = MODULE_CRITICALITY_THRESHOLDS[assessment?.criticality] ?? 100;
  const requiredScore = document?.checkpoint === "push" ? Math.max(0, base - 5) : base;
  const criteria = Array.isArray(assessment?.criteria) ? assessment.criteria.map((criterion) => ({ ...criterion })) : [];
  const active = criteria.filter((criterion) => criterion.status !== "not-applicable");
  const applicablePoints = sum(active.map((criterion) => Number(criterion.points) || 0));
  const earnedScore = sum(active.map((criterion) => criterion.status === "pass" ? Number(criterion.points) || 0 : criterion.status === "partial" ? (Number(criterion.points) || 0) / 2 : 0));
  const score = applicablePoints > 0 ? Math.floor((earnedScore / applicablePoints) * 100) : 0;
  const mandatoryFailure = active.some((criterion) => criterion.mandatory && criterion.status !== "pass");
  return { ...assessment, criteria, requiredScore, applicablePoints, earnedScore, score, status: score >= requiredScore && !mandatoryFailure ? "pass" : "fail" };
}

function requiredDomainScore(document, categoryId) {
  const minimum = THRESHOLDS[document?.riskTier]?.minimumDomainScore ?? 100;
  const profileTarget = PROFILE_DOMAIN_THRESHOLDS[document?.profile]?.[categoryId] ?? minimum;
  const checkpointTarget = document?.checkpoint === "push" ? profileTarget - 5 : profileTarget;
  return Math.max(minimum, checkpointTarget);
}

function requireEnum(issues, value, allowed, field) { if (!allowed.includes(value)) issues.push(`${field} has unsupported value ${String(value)}.`); }
function requireValue(issues, valid, message) { if (!valid) issues.push(message); }
function requireNonEmptyStrings(issues, value, field) { if (!Array.isArray(value) || value.length === 0 || value.some((item) => !nonEmpty(item))) issues.push(`${field} must be a non-empty string array.`); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function validDate(value) { return typeof value === "string" && !Number.isNaN(new Date(value).valueOf()); }
function sum(values) { return values.reduce((total, value) => total + value, 0); }
function report(issues, calculated) { return { valid: issues.length === 0, issues, calculated }; }
