import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createVersionBundle, FUTURE_VERSIONS, generateVersionDocumentation, HISTORICAL_TAGS, loadVersionDocumentationSources, renderVersionPackage, validateVersionDocumentation } from "../src/version-documentation.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("version sources cover every approved future version and historical tag", async () => {
  const sources = await loadVersionDocumentationSources(root);
  const result = validateVersionDocumentation(sources);
  assert.equal(result.valid, true, result.issues.join("\n"));
  assert.equal(result.versionsChecked, FUTURE_VERSIONS.length);
  assert.equal(result.historicalReleasesChecked, HISTORICAL_TAGS.length);
});

test("every version package exposes complete enterprise documentation surfaces", async () => {
  const { catalog } = await loadVersionDocumentationSources(root);
  for (const version of catalog.versions) {
    const files = renderVersionPackage(version, catalog);
    for (const required of ["README.md", "version-spec.yaml", "product/brief.md", "architecture/delta.md", "capabilities/index.md", "interfaces/contracts.md", "assurance/assurance-plan.md", "delivery/delivery-plan.md", "operations/operability.md", "decisions/index.md", "evidence/README.md", "evidence/evidence-requirements.json"]) assert.equal(files.has(`docs/versions/${version.version}/${required}`), true, `${version.version} lacks ${required}`);
    assert.equal(version.implementationContract, `docs/versions/${version.version}/implementation-contract.md`);
    for (const feature of version.features.filter(({ status }) => status === "committed")) assert.equal(files.has(`docs/versions/${version.version}/capabilities/${feature.id}.md`), true);
  }
});

test("v1.4 generated documentation distinguishes implementation preview from release certification", async () => {
  const { catalog } = await loadVersionDocumentationSources(root);
  const version = catalog.versions.find(({ version: number }) => number === "v1.4.0");
  const files = renderVersionPackage(version, catalog);
  const readme = files.get("docs/versions/v1.4.0/README.md");
  const evidence = JSON.parse(files.get("docs/versions/v1.4.0/evidence/evidence-requirements.json"));
  assert.match(readme, /Lifecycle:\*\* implementation-preview/);
  assert.match(readme, /Product maturity:\*\* preview/);
  assert.match(readme, /does not authorize release or stable compatibility claims/);
  assert.equal(evidence.state, "partially-collected");
});

test("generated version documentation is current", async () => {
  const result = await generateVersionDocumentation(root);
  assert.equal(result.valid, true, result.issues.join("\n"));
});

test("version generation applies safely and reports stale or unmanaged outputs", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "forgevena-version-docs-"));
  try {
    for (const relative of [
      "docs/versions/version-specifications.json",
      "docs/foundation/foundation-map.yaml",
      "docs/historical/release-manifests.json",
    ]) {
      const target = path.join(temporary, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(root, relative), target);
    }
    const { catalog } = await loadVersionDocumentationSources(root);
    for (const version of catalog.versions) {
      const target = path.join(temporary, version.implementationContract);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(root, version.implementationContract), target);
    }
    const applied = await generateVersionDocumentation(temporary, { apply: true });
    assert.equal(applied.valid, true, applied.issues.join("\n"));
    assert.equal(applied.applied, true);
    assert.equal((await generateVersionDocumentation(temporary)).valid, true);

    await writeFile(path.join(temporary, "docs/versions/v1.4.0/README.md"), "stale\n", "utf8");
    await writeFile(path.join(temporary, "docs/versions/v1.4.0/unmanaged.md"), "unmanaged\n", "utf8");
    const stale = await generateVersionDocumentation(temporary);
    assert.equal(stale.valid, false);
    assert.ok(stale.update.includes("docs/versions/v1.4.0/README.md"));
    assert.ok(stale.remove.includes("docs/versions/v1.4.0/unmanaged.md"));
    assert.equal(stale.remove.includes("docs/versions/v1.4.0/implementation-contract.md"), false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("catalog validation rejects order drift, dependency cycles, scope promotion, and duplicate features", async () => {
  const sources = await loadVersionDocumentationSources(root);
  const malformed = structuredClone(sources);
  malformed.catalog.versions.reverse();
  malformed.catalog.versions[0].features[0].status = "stable";
  malformed.catalog.versions[0].features.push(structuredClone(malformed.catalog.versions[0].features[0]));
  malformed.catalog.versions[0].dependsOn = [malformed.catalog.versions[0].version];
  const issues = validateVersionDocumentation(malformed).issues.join("\n");
  assert.match(issues, /approved.*dependency order/);
  assert.match(issues, /unsupported status/);
  assert.match(issues, /duplicated/);
  assert.match(issues, /non-prior version/);
});

test("foundation and history validation fail closed", async () => {
  const sources = await loadVersionDocumentationSources(root);
  const malformed = structuredClone(sources);
  malformed.foundation.subjects[1].id = malformed.foundation.subjects[0].id;
  malformed.foundation.subjects[0].authority = "README.md";
  malformed.history.releases.pop();
  const issues = validateVersionDocumentation(malformed).issues.join("\n");
  assert.match(issues, /unique ID/);
  assert.match(issues, /canonical Markdown/);
  assert.match(issues, /immutable stable tag inventory/);
});

test("version APIs reject unknown versions, invalid checkpoints, and malformed roots", async () => {
  assert.match((await generateVersionDocumentation(root, { version: "v9.9.9" })).issues.join("\n"), /Unknown roadmap version/);
  assert.match((await createVersionBundle(root, "v1.4.0", "production")).issues.join("\n"), /Unsupported checkpoint/);
  assert.match((await createVersionBundle(root, "v9.9.9", "planning")).issues.join("\n"), /Unknown roadmap version/);

  const malformed = validateVersionDocumentation({ catalog: null, foundation: null, history: null });
  assert.equal(malformed.valid, false);
  assert.equal(malformed.versionsChecked, 0);
  assert.equal(malformed.foundationSubjectsChecked, 0);
  assert.equal(malformed.historicalReleasesChecked, 0);
});

test("version documentation schemas expose stable contract identifiers", async () => {
  const schemas = [
    "version-spec.schema.json",
    "version-feature.schema.json",
    "version-evidence-requirements.schema.json",
    "foundation-map.schema.json",
    "resolved-version-bundle.schema.json",
  ];
  for (const schema of schemas) {
    const document = JSON.parse(await readFile(path.join(root, "docs", "reference", "schemas", schema), "utf8"));
    assert.equal(document.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(document.$id, /^https:\/\/rohitkumarnaidu\.github\.io\/Forgevena\/schemas\//);
  }
});

test("planning bundles are deterministic and future release claims fail closed", async () => {
  const first = await createVersionBundle(root, "v1.4.0", "planning");
  const second = await createVersionBundle(root, "v1.4.0", "planning");
  assert.equal(first.valid, true, first.issues?.join("\n"));
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal((await readFile(path.join(root, first.output, "bundle-manifest.json"), "utf8")).includes("resolved-canonical-snapshots"), true);
  assert.match((await createVersionBundle(root, "v1.4.0", "release")).issues.join("\n"), /require retained implementation evidence/);
});
