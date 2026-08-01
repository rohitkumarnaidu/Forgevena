import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const FUTURE_VERSIONS = Object.freeze([
  "v1.4.0", "v1.5.0", "v1.6.0", "v1.7.0", "v1.8.0", "v1.9.0", "v1.10.0", "v2.0.0",
  "v2.1.0", "v2.2.0", "v2.3.0", "v2.4.0", "v2.5.0", "v2.6.0", "v2.7.0", "v3.0.0",
]);

export const HISTORICAL_TAGS = Object.freeze(["v1.2.0", "v1.2.1", "v1.2.2", "v1.2.3", "v1.3.0"]);

const CHECKPOINTS = Object.freeze(["planning", "rc", "release"]);
const FEATURE_STATUSES = Object.freeze(["committed", "candidate", "deferred"]);
const VERSION_LIFECYCLES = Object.freeze(["planned", "implementation-preview", "release-candidate", "released"]);
const PRODUCT_MATURITIES = Object.freeze(["not-implemented", "preview", "stable"]);
const EVIDENCE_STATES = Object.freeze(["required-not-collected", "partially-collected", "collected", "verified", "expired"]);
const VERSION_SOURCE = path.join("docs", "versions", "version-specifications.json");
const FOUNDATION_SOURCE = path.join("docs", "foundation", "foundation-map.yaml");
const HISTORY_SOURCE = path.join("docs", "historical", "release-manifests.json");

export async function loadVersionDocumentationSources(root) {
  const [catalog, foundation, history] = await Promise.all([
    readJson(path.join(root, VERSION_SOURCE)),
    readJson(path.join(root, FOUNDATION_SOURCE)),
    readJson(path.join(root, HISTORY_SOURCE)),
  ]);
  return { catalog, foundation, history };
}

export function validateVersionDocumentation({ catalog, foundation, history }) {
  const issues = [];
  validateCatalog(catalog, issues);
  validateFoundation(foundation, issues);
  validateHistory(history, issues);
  return {
    valid: issues.length === 0,
    issues,
    versionsChecked: Array.isArray(catalog?.versions) ? catalog.versions.length : 0,
    historicalReleasesChecked: Array.isArray(history?.releases) ? history.releases.length : 0,
    foundationSubjectsChecked: Array.isArray(foundation?.subjects) ? foundation.subjects.length : 0,
  };
}

export async function generateVersionDocumentation(root, { apply = false, version } = {}) {
  const sources = await loadVersionDocumentationSources(root);
  const validation = validateVersionDocumentation(sources);
  if (!validation.valid) return { ...validation, create: [], update: [], remove: [] };
  const selected = version ? sources.catalog.versions.filter((entry) => entry.version === version) : sources.catalog.versions;
  if (version && selected.length !== 1) return { valid: false, issues: [`Unknown roadmap version ${version}.`], create: [], update: [], remove: [] };
  const contractIssues = await validateImplementationContracts(root, selected);
  if (contractIssues.length) return { ...validation, valid: false, issues: contractIssues, create: [], update: [], remove: [] };

  const expected = new Map();
  for (const specification of selected) {
    for (const [relative, contents] of renderVersionPackage(specification, sources.catalog).entries()) expected.set(relative, contents);
  }
  if (!version) {
    for (const [relative, contents] of renderSystemIndexes(sources).entries()) expected.set(relative, contents);
  }

  const changes = await compareExpected(root, expected, new Set(selected.map(({ implementationContract }) => implementationContract)));
  if (apply) for (const [relative, contents] of expected) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
  }
  if (apply) return { ...validation, create: [], update: [], remove: [], applied: true, files: [...expected.keys()].sort() };
  return { ...validation, ...changes, applied: false, files: [...expected.keys()].sort() };
}

export async function createVersionBundle(root, version, checkpoint = "planning") {
  if (!CHECKPOINTS.includes(checkpoint)) return { valid: false, issues: [`Unsupported checkpoint ${checkpoint}.`] };
  const sources = await loadVersionDocumentationSources(root);
  const validation = validateVersionDocumentation(sources);
  if (!validation.valid) return validation;
  const specification = sources.catalog.versions.find((entry) => entry.version === version);
  if (!specification) return { valid: false, issues: [`Unknown roadmap version ${version}.`] };
  if (checkpoint !== "planning") return { valid: false, issues: [`${checkpoint} bundles require retained implementation evidence and are unavailable for planned version ${version}.`] };

  const output = path.join(root, "dist", "version-bundles", `${version}-${checkpoint}`);
  await rm(output, { recursive: true, force: true });
  const files = new Map(renderVersionPackage(specification, sources.catalog));
  files.set("implementation-contract.md", await readFile(path.join(root, specification.implementationContract), "utf8"));
  for (const subject of sources.foundation.subjects) {
    const canonicalPath = path.join(root, subject.authority);
    files.set(path.join("foundation", subject.id, path.basename(subject.authority)).replaceAll("\\", "/"), await readFile(canonicalPath, "utf8"));
  }
  const manifestFiles = [];
  for (const [relative, contents] of [...files.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const bundleRelative = relative.startsWith("docs/versions/") ? relative.slice(`docs/versions/${version}/`.length) : relative;
    const target = path.join(output, bundleRelative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
    manifestFiles.push({ path: bundleRelative.replaceAll("\\", "/"), sha256: sha256(contents) });
  }
  const manifest = {
    schemaVersion: 1,
    version,
    checkpoint,
    generatedFrom: specification.roadmapAuthority,
    authorityMode: "resolved-canonical-snapshots",
    files: manifestFiles,
  };
  await writeFile(path.join(output, "bundle-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { valid: true, issues: [], output: path.relative(root, output), manifest };
}

export function renderVersionPackage(specification, catalog) {
  const root = `docs/versions/${specification.version}`;
  const files = new Map();
  files.set(`${root}/README.md`, renderReadme(specification));
  files.set(`${root}/version-spec.yaml`, `${JSON.stringify(specification, null, 2)}\n`);
  files.set(`${root}/product/brief.md`, renderProduct(specification));
  files.set(`${root}/architecture/delta.md`, renderArchitecture(specification));
  files.set(`${root}/capabilities/index.md`, renderCapabilityIndex(specification));
  for (const feature of specification.features.filter(({ status }) => status === "committed")) files.set(`${root}/capabilities/${feature.id}.md`, renderFeature(specification, feature));
  files.set(`${root}/interfaces/contracts.md`, renderInterfaces(specification));
  files.set(`${root}/assurance/assurance-plan.md`, renderAssurance(specification));
  files.set(`${root}/delivery/delivery-plan.md`, renderDelivery(specification));
  files.set(`${root}/operations/operability.md`, renderOperations(specification));
  files.set(`${root}/decisions/index.md`, renderDecisions(specification));
  files.set(`${root}/evidence/README.md`, renderEvidence(specification));
  files.set(`${root}/evidence/evidence-requirements.json`, `${JSON.stringify(evidenceRequirements(specification), null, 2)}\n`);
  return files;
}

function validateCatalog(catalog, issues) {
  if (!isObject(catalog) || catalog.schemaVersion !== 1 || !Array.isArray(catalog.versions)) return issues.push("Version specification catalog must use schemaVersion 1 and define versions.");
  const actual = catalog.versions.map(({ version }) => version);
  if (JSON.stringify(actual) !== JSON.stringify(FUTURE_VERSIONS)) issues.push("Version specification catalog must preserve the approved v1.4.0 through v3.0.0 dependency order.");
  const ids = new Set();
  for (const [index, version] of catalog.versions.entries()) {
    const prefix = `Version ${version?.version ?? `<index:${index}>`}`;
    for (const field of ["version", "title", "outcome", "owner", "roadmapAuthority", "riskTier", "implementationContract"]) if (!nonEmpty(version?.[field])) issues.push(`${prefix} requires ${field}.`);
    if (!/^v\d+\.\d+\.\d+$/.test(version?.version ?? "")) issues.push(`${prefix} must use vX.Y.Z.`);
    if (version?.implementationContract !== `docs/versions/${version?.version}/implementation-contract.md`) issues.push(`${prefix} requires its canonical implementation contract.`);
    if (!Array.isArray(version?.dependsOn) || !Array.isArray(version?.blocks)) issues.push(`${prefix} requires dependency arrays.`);
    if (!Array.isArray(version?.nonGoals) || !version.nonGoals.length) issues.push(`${prefix} requires non-goals.`);
    if (!Array.isArray(version?.metrics) || !version.metrics.length) issues.push(`${prefix} requires measurable outcomes.`);
    if (!Array.isArray(version?.acceptance) || !version.acceptance.length) issues.push(`${prefix} requires acceptance gates.`);
    if (version?.lifecycle && !VERSION_LIFECYCLES.includes(version.lifecycle)) issues.push(`${prefix} has unsupported lifecycle ${version.lifecycle}.`);
    if (version?.productMaturity && !PRODUCT_MATURITIES.includes(version.productMaturity)) issues.push(`${prefix} has unsupported product maturity ${version.productMaturity}.`);
    if (version?.evidenceState && !EVIDENCE_STATES.includes(version.evidenceState)) issues.push(`${prefix} has unsupported evidence state ${version.evidenceState}.`);
    if (!Array.isArray(version?.features) || !version.features.some(({ status }) => status === "committed")) issues.push(`${prefix} requires committed features.`);
    for (const feature of version?.features ?? []) validateFeature(feature, prefix, ids, issues);
    for (const dependency of version?.dependsOn ?? []) if (FUTURE_VERSIONS.includes(dependency) && FUTURE_VERSIONS.indexOf(dependency) >= index) issues.push(`${prefix} depends on non-prior version ${dependency}.`);
  }
}

function validateFeature(feature, prefix, ids, issues) {
  if (!isObject(feature)) return issues.push(`${prefix} has a malformed feature.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature.id ?? "")) issues.push(`${prefix} feature ${feature.id ?? "<unknown>"} requires a kebab-case ID.`);
  if (ids.has(feature.id)) issues.push(`Feature ID ${feature.id} is duplicated.`);
  ids.add(feature.id);
  if (!FEATURE_STATUSES.includes(feature.status)) issues.push(`${prefix} feature ${feature.id} has unsupported status ${feature.status}.`);
  for (const field of ["title", "summary", "value", "architecture"]) if (!nonEmpty(feature[field])) issues.push(`${prefix} feature ${feature.id} requires ${field}.`);
  for (const field of ["dependencies", "acceptance", "risks"]) if (!Array.isArray(feature[field]) || !feature[field].length) issues.push(`${prefix} feature ${feature.id} requires ${field}.`);
}

function validateFoundation(foundation, issues) {
  if (!isObject(foundation) || foundation.schemaVersion !== 1 || !Array.isArray(foundation.subjects)) return issues.push("Foundation map must use schemaVersion 1 and define subjects.");
  const ids = new Set();
  for (const subject of foundation.subjects) {
    if (!nonEmpty(subject.id) || ids.has(subject.id)) issues.push(`Foundation subject ${subject.id ?? "<unknown>"} must have a unique ID.`);
    ids.add(subject.id);
    for (const field of ["title", "authority", "documentId", "owner", "lifecycle", "reviewBy"]) if (!nonEmpty(subject[field])) issues.push(`Foundation subject ${subject.id ?? "<unknown>"} requires ${field}.`);
    if (!String(subject.authority ?? "").startsWith("docs/") || !String(subject.authority ?? "").endsWith(".md")) issues.push(`Foundation subject ${subject.id} must reference a canonical Markdown document.`);
  }
}

function validateHistory(history, issues) {
  if (!isObject(history) || history.schemaVersion !== 1 || !Array.isArray(history.releases)) return issues.push("Historical release manifest must use schemaVersion 1 and define releases.");
  const tags = history.releases.map(({ tag }) => tag);
  if (JSON.stringify(tags) !== JSON.stringify(HISTORICAL_TAGS)) issues.push("Historical release manifest must cover exactly the immutable stable tag inventory.");
  for (const release of history.releases) {
    for (const field of ["tag", "commit", "outcome", "decision", "notes", "retrospective"]) if (!nonEmpty(release[field])) issues.push(`Historical release ${release.tag ?? "<unknown>"} requires ${field}.`);
  }
}

function renderSystemIndexes({ catalog, foundation, history }) {
  const files = new Map();
  files.set("docs/versions/README.md", renderVersionsIndex(catalog));
  files.set("docs/versions/dependency-map.md", renderDependencyMap(catalog));
  files.set("docs/versions/coverage-matrix.md", renderCoverage(catalog));
  files.set("docs/foundation/README.md", renderFoundationIndex(foundation));
  files.set("docs/historical/README.md", renderHistoricalIndex(history));
  for (const subject of foundation.subjects) files.set(`docs/foundation/${subject.id}/README.md`, renderFoundationSubject(subject));
  for (const group of ["phases", "audits", "releases", "retired-plans"]) files.set(`docs/historical/${group}/README.md`, renderHistoricalGroup(group, history));
  return files;
}

function renderReadme(version) {
  return header(version, `${version.title} is an approved roadmap delta specification. Its lifecycle metadata distinguishes implementation progress from release certification.`) + `## Outcome\n\n${version.outcome}\n\n## Status\n\n- **Lifecycle:** ${lifecycle(version)}\n- **Product maturity:** ${productMaturity(version)}\n- **Risk:** ${version.riskTier}\n- **Owner:** ${version.owner}\n- **Depends on:** ${listInline(version.dependsOn)}\n- **Blocks:** ${listInline(version.blocks)}\n\n## Package Navigation\n\n- [Product brief](product/brief.md)\n- [Architecture delta](architecture/delta.md)\n- [Normative implementation contract](implementation-contract.md)\n- [Capabilities](capabilities/index.md)\n- [Interfaces and contracts](interfaces/contracts.md)\n- [Assurance plan](assurance/assurance-plan.md)\n- [Delivery plan](delivery/delivery-plan.md)\n- [Operability](operations/operability.md)\n- [Decisions](decisions/index.md)\n- [Evidence requirements](evidence/README.md)\n\n## Authority\n\nPermanent architecture remains in the [foundation facade](../../foundation/README.md). Implementation-preview status records completed local software work only; it does not authorize release or stable compatibility claims.\n`;
}

function renderProduct(version) {
  return header(version, "Defines product intent, users, scope, non-goals, journeys, value, and measurable outcomes.") + `## Problem and Business Value\n\n${version.outcome}\n\nThis version reduces the operational and governance risk represented by its committed work while preserving local-first operation and human authority.\n\n## Personas and Journeys\n\n- **Individual developer:** previews, validates, and adopts the capability locally.\n- **Platform engineer:** configures policy, compatibility, and operational boundaries.\n- **Security or compliance reviewer:** verifies evidence without receiving secrets or source content.\n- **Maintainer:** publishes, supports, migrates, and retires the capability safely.\n\nThe primary journey is discover or configure, preview, validate, approve, apply, observe, update, and roll back.\n\n## Scope\n\n${featureList(version, "committed")}\n\n## Candidates\n\n${featureList(version, "candidate")}\n\n## Non-Goals\n\n${bullets(version.nonGoals)}\n\n## Success Metrics\n\n${bullets(version.metrics)}\n`;
}

function renderArchitecture(version) {
  return header(version, "Defines only the architecture delta from the canonical Forgevena platform blueprint.") + `## Architecture Delta\n\n${version.architectureDelta}\n\n\`\`\`mermaid\nflowchart LR\n  U[\"User or governed automation\"] --> P[\"Preview and policy\"]\n  P --> C[\"${version.title}\"]\n  C --> S[\"State, evidence, and rollback\"]\n  S --> V[\"Validation and health\"]\n\`\`\`\n\n## Component and Module Boundaries\n\nCommitted features remain behind existing application-context, state, policy, consent, audit, and rollback services. No feature may introduce a parallel authority.\n\n## Data and Control Flow\n\nInputs are schema-validated, classified, and policy-evaluated. External effects stop at consent boundaries. Outputs contain metadata and evidence references, while secrets and sensitive content remain excluded.\n\n## Dependencies\n\n${bullets(version.dependsOn.length ? version.dependsOn : ["Current stable local platform contracts."])}\n\n## Failure Modes\n\n- Partial operations recover from journals or last-known-good state.\n- Unsupported compatibility fails visibly.\n- Missing credentials, approval, billing, or network access stops at preflight.\n- Corrupt or unverifiable evidence blocks promotion.\n`;
}

function renderCapabilityIndex(version) {
  const rows = version.features.map((feature) => `| \`${feature.id}\` | ${feature.title} | ${feature.status} | ${feature.status === "committed" ? `[Specification](${feature.id}.md)` : "Evidence Funnel required"} |`).join("\n");
  return header(version, "Provides the authoritative feature inventory and commitment classification for this version.") + `| Feature ID | Feature | Classification | Detail |\n| --- | --- | --- | --- |\n${rows}\n\nCandidate and deferred entries are not authorized for implementation and cannot silently become committed through generated documentation.\n`;
}

function renderFeature(version, feature) {
  return header(version, `Feature specification for ${feature.title}.`) + `## Identity\n\n- **Feature ID:** \`${feature.id}\`\n- **Classification:** ${feature.status}\n- **Owner:** ${version.owner}\n\n## Purpose and Problem\n\n${feature.summary}\n\n## Business and Developer Value\n\n${feature.value}\n\n## Architecture\n\n${feature.architecture}\n\n## Dependencies\n\n${bullets(feature.dependencies)}\n\n## Configuration and User Flow\n\nConfiguration is schema-validated, secret-reference-only, previewable, exportable without secrets, and governed by scope. The user flow is inspect, preview, validate, approve, apply, verify, and roll back.\n\n## CLI, Dashboard, and API Flow\n\nCLI, dashboard, SDK, and API surfaces call the same domain service. Structured responses include operation ID, status, warnings, planned changes, policy result, and evidence references. No interface may bypass consent or policy.\n\n## Security, Privacy, and Reliability\n\nPermissions, data classes, trust roots, external effects, timeouts, retries, cancellation, audit, recovery, and rollback are explicit. Prompts, responses, tokens, credentials, and unapproved source content are excluded from logs and diagnostics.\n\n## Testing and Acceptance\n\n${bullets(feature.acceptance)}\n\n## Performance Targets\n\nThe feature must publish an approved baseline, remain within the platform's 20% regression budget, and define tighter latency, throughput, resource, and cost targets before preview.\n\n## Migration and Documentation\n\nMigration is preview-first, versioned, reversible, and compatible with the previous two stable releases where applicable. CLI help, schemas, examples, troubleshooting, operations, security, and migration guidance ship with implementation.\n\n## Risks\n\n${bullets(feature.risks)}\n\n## Future Expansion\n\nExpansion remains in the Evidence Funnel and requires a new feature ID or approved scope change; it cannot be inferred from this specification.\n`;
}

function renderInterfaces(version) {
  return header(version, "Defines version-level CLI, API, SDK, dashboard, schema, and compatibility obligations.") + `## Contract Rules\n\n- Preserve \`forgevena\`, \`ai-workspace\`, \`.ai-workspace/\`, structured envelopes, preview-first mutation, and explicit external consent.\n- Add interfaces only through versioned schemas and shared domain services.\n- Document authentication references, permissions, rate limits, pagination, errors, idempotency, cancellation, and compatibility.\n- Never place credentials or sensitive content in arguments, URLs, logs, state, diagnostics, or evidence.\n\n## Surface Impact\n\n${bullets(version.interfaceImpacts)}\n\n## Compatibility\n\nBackward compatibility is required throughout 1.x. Later breaking changes require deprecation, migration preview, compatibility reports, rollback, and support for the final prior-major release.\n`;
}

function renderAssurance(version) {
  return header(version, "Defines the mandatory security, privacy, safety, quality, accessibility, and performance evidence.") + `## Threat and Privacy Review\n\nThreat modeling covers trust boundaries, identity, authorization, secrets, data egress, supply chain, abuse, denial of service, rollback, and incident recovery. Data classification covers collection, purpose, retention, deletion, residency, export, and revocation.\n\n## AI Safety and Human Authority\n\nAI-assisted behavior is bounded, explainable, cancellable, budgeted, evaluated with deterministic fixtures, and read-only by default. Mutation, deployment, billing, publication, credential use, and policy changes require explicit human authority.\n\n## Quality Gates\n\n- Critical security, privacy, policy, trust, migration, rollback, and contract controls: **100%**.\n- Important architecture, API, operations, accessibility, and release controls: **95%**.\n- Standard quality and developer-experience controls: **90%**.\n- No overall score compensates for a mandatory failure.\n\n## Version Acceptance Gates\n\n${bullets(version.acceptance)}\n`;
}

function renderDelivery(version) {
  return header(version, "Defines implementation sequencing, validation, migration, rollback, release, documentation, and adoption.") + `## Implementation Sequence\n\n1. Discovery evidence, RFC, ADR, threat model, schemas, and readiness scorecard.\n2. Small implementation changes with unit and contract tests.\n3. Integration, failure, security, performance, accessibility, and migration validation.\n4. Documentation, examples, runbooks, compatibility evidence, and release candidate.\n5. Clean install, upgrade, rollback, offline, and cross-platform rehearsals.\n6. Human-controlled stable promotion and post-release verification.\n\n## Migration, Rollback, and Roll-Forward\n\nMigration preserves backups and produces a dry-run report. Rollback restores only managed state and never deletes unmanaged files. Roll-forward is preferred after publication when immutable tags or external packages cannot be replaced.\n\n## Release and Documentation\n\nThe release includes signed tag, changelog, release notes, packages, SBOM, provenance, checksums, compatibility matrix, known limitations, scorecard, post-release review, website update, and support communication.\n\n## Dependencies and Milestones\n\n- **Depends on:** ${listInline(version.dependsOn)}\n- **Blocks:** ${listInline(version.blocks)}\n- Dates remain unset until discovery and capacity approval; documentation must not invent commitments.\n`;
}

function renderOperations(version) {
  return header(version, "Defines operational readiness, SLOs, observability, support, continuity, and retirement.") + `## SLOs and Error Budgets\n\nBefore preview, owners define availability, latency, correctness, recovery, compatibility-freshness, and support-response objectives with measurable error budgets.\n\n## Observability\n\nMetrics and traces are metadata-only, bounded, local by default, and correlated by operation ID. Health reports distinguish configuration, dependency, policy, compatibility, and external-service failures.\n\n## Resilience and Recovery\n\nRequired exercises cover crash recovery, corruption, dependency outage, provider failure, network isolation, disk-full, permission denial, backup restore, rollback, and disaster recovery.\n\n## Support and Sustainability\n\nDocument ownership, escalation, incident response, LTS policy, deprecation, end of support, decommissioning, maintainer succession, bus factor, capacity, operating cost, and legal obligations before stable release.\n`;
}

function renderDecisions(version) {
  return header(version, "Tracks decisions, assumptions, rejected alternatives, open questions, expiry, and risk ownership.") + `## Required Decisions\n\n- Architecture and trust-boundary ADRs must be approved before implementation.\n- Every external protocol, schema, storage change, compatibility policy, and lifecycle authority requires an owner and review date.\n\n## Assumptions\n\n${bullets(version.assumptions)}\n\n## Open Questions\n\n${bullets(version.openQuestions)}\n\n## Decision Expiry\n\nUnresolved questions block affected implementation. Assumptions expire at the first release candidate unless converted into verified evidence or approved decisions.\n`;
}

function renderEvidence(version) {
  const status = evidenceState(version) === "required-not-collected"
    ? "**Not collected.** This version is planned and documentation alone does not authorize implementation or certify readiness."
    : `**Partially collected.** ${version.evidenceSummary}`;
  const links = (version.evidenceLinks ?? []).length ? `\n\n## Retained Local Evidence\n\n${version.evidenceLinks.map((entry) => `- [${entry.title}](${entry.href})`).join("\n")}` : "";
  return header(version, "Lists collected and outstanding evidence without converting local implementation results into release certification.") + `## Current Evidence Status\n\n${status}${links}\n\n## Required Release Evidence\n\n- Requirements, RFC, ADR, threat model, privacy review, and readiness scorecard.\n- Unit, integration, CLI/API contract, security, accessibility, performance, resilience, migration, rollback, and cross-platform results.\n- Documentation impact bundle, compatibility report, SBOM, provenance, checksums, and license review.\n- Release-candidate installation, upgrade, offline, rollback, and post-release channel verification.\n\nMachine-readable requirements are retained in [evidence-requirements.json](evidence-requirements.json).\n`;
}

function evidenceRequirements(version) {
  return {
    schemaVersion: 1,
    version: version.version,
    state: evidenceState(version),
    mandatory: ["requirements", "rfc", "adr", "threat-model", "privacy-review", "readiness-scorecard", "tests", "security", "accessibility", "performance", "migration", "rollback", "documentation-impact", "compatibility", "sbom", "provenance", "release-verification", "post-release-review"],
    gates: { critical: 100, important: 95, standard: 90 },
    acceptance: version.acceptance,
  };
}

function renderVersionsIndex(catalog) {
  const rows = catalog.versions.map((version) => `| [${version.version}](${version.version}/README.md) | ${version.title} | ${version.riskTier} | ${listInline(version.dependsOn)} |`).join("\n");
  return `# Enterprise Version Specifications\n\nThese packages document approved roadmap deltas without duplicating permanent architecture. They are planning authority only after governance approval and do not certify unimplemented capabilities.\n\n| Version | Outcome | Risk | Depends on |\n| --- | --- | --- | --- |\n${rows}\n\nSee the [dependency map](dependency-map.md), [coverage matrix](coverage-matrix.md), and [foundation facade](../foundation/README.md).\n`;
}

function renderDependencyMap(catalog) {
  const edges = catalog.versions.flatMap((version) => version.dependsOn.filter((dependency) => FUTURE_VERSIONS.includes(dependency)).map((dependency) => `  ${nodeId(dependency)} --> ${nodeId(version.version)}`)).join("\n");
  return `# Version Dependency Map\n\n\`\`\`mermaid\nflowchart LR\n${edges}\n\`\`\`\n\nThe order is binding by default. Reordering requires the governed roadmap-change process.\n`;
}

function renderCoverage(catalog) {
  const rows = catalog.versions.map((version) => `| ${version.version} | ${version.features.filter(({ status }) => status === "committed").length} | ${version.features.filter(({ status }) => status === "candidate").length} | ${version.acceptance.length} | Complete planned package |`).join("\n");
  return `# Version Documentation Coverage\n\n| Version | Committed | Candidate | Gates | Documentation status |\n| --- | ---: | ---: | ---: | --- |\n${rows}\n\nEvidence remains uncollected until implementation and release validation occur.\n`;
}

function renderFoundationIndex(foundation) {
  return `# Foundation Authority Facade\n\nThis facade provides stable discovery without moving or duplicating canonical documents.\n\n${foundation.subjects.map((subject) => `- [${subject.title}](${subject.id}/README.md)`).join("\n")}\n`;
}

function renderFoundationSubject(subject) {
  const relative = path.relative(path.join("docs", "foundation", subject.id), subject.authority).replaceAll("\\", "/");
  return `# ${subject.title}\n\n- **Canonical authority:** [${subject.authority}](${relative})\n- **Document ID:** \`${subject.documentId}\`\n- **Owner:** ${subject.owner}\n- **Lifecycle:** ${subject.lifecycle}\n- **Review by:** ${subject.reviewBy}\n\nThis page is a navigation facade. The linked document remains the sole source of truth.\n`;
}

function renderHistoricalIndex(history) {
  return `# Historical Documentation Facade\n\nHistorical records remain immutable evidence and are never upgraded to current authority.\n\n- [Phases](phases/README.md)\n- [Audits](audits/README.md)\n- [Releases](releases/README.md)\n- [Retired plans](retired-plans/README.md)\n\n## Stable Tag Inventory\n\n${history.releases.map((release) => `- **${release.tag}:** ${release.outcome}; ${release.decision}.`).join("\n")}\n`;
}

function renderHistoricalGroup(group, history) {
  if (group !== "releases") return `# Historical ${titleCase(group)}\n\nThis is a discovery facade over immutable records classified by the generated documentation catalog. No historical files are moved or rewritten.\n`;
  const rows = history.releases.map((release) => `| ${release.tag} | \`${release.commit}\` | ${release.outcome} | [Notes](../../${release.notes.replace(/^docs\//, "")}) | [Retrospective](../../${release.retrospective.replace(/^docs\//, "")}) |`).join("\n");
  return `# Historical Releases\n\n| Tag | Commit | Outcome | Notes | Governance assessment |\n| --- | --- | --- | --- | --- |\n${rows}\n`;
}

function header(version, purpose) {
  return `# ${version.version} — ${version.title}\n\n> **Purpose:** ${purpose}\n> **Audience:** product, architecture, engineering, security, operations, documentation, release, and AI coding agents\n> **Owner:** ${version.owner}\n> **Roadmap authority:** \`${version.roadmapAuthority}\`\n> **Lifecycle:** ${lifecycle(version)}\n> **Review:** before implementation and at every lifecycle promotion\n\n`;
}

function lifecycle(version) {
  return version.lifecycle ?? "planned";
}

function productMaturity(version) {
  return version.productMaturity ?? "not-implemented";
}

function evidenceState(version) {
  return version.evidenceState ?? "required-not-collected";
}

async function compareExpected(root, expected, preserved = new Set()) {
  const create = [];
  const update = [];
  for (const [relative, contents] of expected) {
    try { if (normalize(await readFile(path.join(root, relative), "utf8")) !== normalize(contents)) update.push(relative); }
    catch (error) { if (error.code === "ENOENT") create.push(relative); else throw error; }
  }
  const generatedRoots = [path.join(root, "docs", "versions")];
  const remove = [];
  for (const generatedRoot of generatedRoots) {
    try {
      for (const relative of await walk(generatedRoot)) {
        const repositoryRelative = path.relative(root, relative).replaceAll("\\", "/");
        if (repositoryRelative.endsWith("version-specifications.json")) continue;
        if (!expected.has(repositoryRelative) && !preserved.has(repositoryRelative) && /docs\/versions\/v\d/.test(repositoryRelative)) remove.push(repositoryRelative);
      }
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return { create, update, remove, valid: create.length === 0 && update.length === 0 && remove.length === 0, issues: [...create.map((file) => `${file} is missing.`), ...update.map((file) => `${file} is stale.`), ...remove.map((file) => `${file} is unmanaged.`)] };
}

async function validateImplementationContracts(root, specifications) {
  const issues = [];
  for (const specification of specifications) {
    const contractPath = specification.implementationContract;
    try {
      const contents = await readFile(path.join(root, contractPath), "utf8");
      if (contents.length < 1800 || !contents.includes("# ")) issues.push(`${contractPath} is incomplete.`);
    } catch (error) {
      if (error.code === "ENOENT") issues.push(`${contractPath} is missing.`);
      else throw error;
    }
  }
  return issues;
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(target));
    else output.push(target);
  }
  return output;
}

async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
function sha256(value) { return createHash("sha256").update(normalize(value)).digest("hex"); }
function normalize(value) { return String(value).replace(/\r\n/g, "\n"); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function isObject(value) { return value && typeof value === "object" && !Array.isArray(value); }
function bullets(values) { return values.length ? values.map((value) => `- ${value}`).join("\n") : "- None."; }
function featureList(version, status) { const values = version.features.filter((feature) => feature.status === status).map((feature) => `**${feature.title}:** ${feature.summary}`); return values.length ? bullets(values) : "- None approved."; }
function listInline(values) { return values.length ? values.map((value) => `\`${value}\``).join(", ") : "current stable platform"; }
function nodeId(value) { return value.replaceAll(".", "_").replace("v", "V"); }
function titleCase(value) { return value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
