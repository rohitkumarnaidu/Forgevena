import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditDocumentation, buildDocumentationCatalog, DOCUMENTATION_CLASSES, DOCUMENTATION_LIFECYCLE } from "../src/documentation-catalog.js";

test("documentation catalog classifies active, canonical, historical, and generated documents", async () => {
  const root = await fixture("forgevena-document-catalog-");
  try {
    await write(root, "docs/strategy/PLATFORM_CONSTITUTION.md", "# Platform Constitution\n");
    await write(root, "docs/audit/OLD_REPORT.md", "# Old Report\n");
    await write(root, "docs/getting-started/index.md", "# Getting Started\n");
    const catalog = await buildDocumentationCatalog(root);
    const byPath = new Map(catalog.documents.map((document) => [document.path, document]));
    assert.equal(byPath.get("docs/strategy/PLATFORM_CONSTITUTION.md").classification, "canonical-policy");
    assert.equal(byPath.get("docs/audit/OLD_REPORT.md").classification, "historical-record");
    assert.equal(byPath.get("docs/audit/OLD_REPORT.md").lifecycle, "archived");
    assert.equal(byPath.get("docs/getting-started/index.md").contentType, "tutorial");
    assert.equal(byPath.get("docs/reference/generated/cli.md").classification, "generated-reference");
    assert.ok(catalog.documents.every((document) => DOCUMENTATION_CLASSES.includes(document.classification)));
    assert.ok(catalog.documents.every((document) => DOCUMENTATION_LIFECYCLE.includes(document.lifecycle)));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("documentation audit rejects duplicate site metadata and stale active claims", async () => {
  const root = await fixture("forgevena-document-audit-");
  try {
    await write(root, "docs/index.md", "# Home\n\nRelease: 1.0.0.\n");
    await write(root, "website/mkdocs.yml", "site_description: one\nsite_description: two\n");
    const catalog = await buildDocumentationCatalog(root);
    const audit = await auditDocumentation(root, catalog);
    assert.equal(audit.decision, "hold");
    assert.match(audit.issues.map((issue) => issue.code).join(" "), /duplicate-site-description/);
    assert.match(audit.issues.map((issue) => issue.code).join(" "), /stale-version-claim/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("documentation catalog covers every governed classification and metadata facet", async () => {
  const root = await fixture("forgevena-document-taxonomy-");
  try {
    const documents = [
      ["docs/evidence/change.md", "# Change Evidence\n"],
      ["docs/operations/recovery.md", "# Recovery Runbook\n"],
      ["docs/strategy/candidate.md", "# Candidate Strategy\n"],
      ["docs/architecture/component.md", "# Component Architecture\n"],
      ["docs/releases/v0.md", "# Historical Release\n"],
      ["docs/tutorials/first-run.md", "# First Run\n"],
      ["docs/deployment/guide.md", "# Deployment Guide\n"],
      ["docs/api/reference.md", "# API Reference\n"],
      ["docs/security/privacy.md", "# Privacy and Security\n"],
    ];
    for (const [relative, contents] of documents) await write(root, relative, contents);
    const catalog = await buildDocumentationCatalog(root);
    const byPath = new Map(catalog.documents.map((document) => [document.path, document]));
    assert.equal(byPath.get("docs/evidence/change.md").classification, "governance-evidence");
    assert.equal(byPath.get("docs/operations/recovery.md").classification, "operational-runbook");
    assert.equal(byPath.get("docs/strategy/candidate.md").classification, "product-strategy");
    assert.equal(byPath.get("docs/architecture/component.md").classification, "canonical-architecture");
    assert.equal(byPath.get("docs/releases/v0.md").classification, "historical-record");
    assert.equal(byPath.get("docs/tutorials/first-run.md").contentType, "tutorial");
    assert.equal(byPath.get("docs/deployment/guide.md").contentType, "how-to");
    assert.equal(byPath.get("docs/api/reference.md").contentType, "reference");
    assert.equal(byPath.get("docs/security/privacy.md").criticality, "important");
    assert.equal(byPath.get("docs/security/privacy.md").relevance.security, true);
    assert.equal(byPath.get("docs/security/privacy.md").relevance.privacy, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("documentation audit fails closed for duplicate authority, stale metadata, and invalid history", async () => {
  const root = await fixture("forgevena-document-failures-");
  try {
    await write(root, "website/mkdocs.yml", "site_description: valid\n");
    const catalog = {
      schemaVersion: 1,
      generatedAt: "2026-07-28",
      summary: { total: 3 },
      documents: [
        { id: "duplicate", path: "docs/one.md", authority: "shared", lifecycle: "maintained", reviewBy: "2026-01-01", classification: "canonical-policy" },
        { id: "duplicate", path: "docs/two.md", authority: "shared", lifecycle: "maintained", reviewBy: "2027-01-01", classification: "canonical-policy" },
        { id: "history", path: "docs/releases/old.md", authority: null, lifecycle: "maintained", reviewBy: "2027-01-01", classification: "historical-record" },
      ],
    };
    const audit = await auditDocumentation(root, catalog, { now: new Date("2026-07-28T00:00:00Z") });
    const codes = audit.issues.map(({ code }) => code);
    assert.equal(audit.decision, "hold");
    for (const code of ["duplicate-id", "duplicate-authority", "stale-document", "history-lifecycle", "canonical-navigation"]) assert.ok(codes.includes(code), code);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function fixture(prefix) { const root = await mkdtemp(path.join(os.tmpdir(), prefix)); await mkdir(path.join(root, "docs"), { recursive: true }); return root; }
async function write(root, relative, contents) { const target = path.join(root, relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, contents); }
