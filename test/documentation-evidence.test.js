import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { analyzeDocumentationImpact } from "../src/documentation-impact.js";
import { REQUIRED_DOCUMENTATION_EVIDENCE_REPORTS, validateDocumentationEvidenceBundle, writeDocumentationEvidenceBundle } from "../src/documentation-evidence.js";

test("documentation evidence writes and verifies every required report", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "forgevena-doc-evidence-"));
  try {
    const report = analyzeDocumentationImpact(["docs/faq/index.md"], { changeId: "docs-1", generatedAt: "2026-07-28T00:00:00.000Z", checkpoint: "merge" });
    const result = await writeDocumentationEvidenceBundle(process.cwd(), output, report);
    assert.equal(Object.keys(result.manifest.reports).length, REQUIRED_DOCUMENTATION_EVIDENCE_REPORTS.length);
    assert.deepEqual(await validateDocumentationEvidenceBundle(output), { valid: true, issues: [], reportsChecked: REQUIRED_DOCUMENTATION_EVIDENCE_REPORTS.length });
  } finally { await rm(output, { recursive: true, force: true }); }
});

test("documentation evidence detects modified and corrupt reports", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "forgevena-doc-evidence-"));
  try {
    const report = analyzeDocumentationImpact(["docs/faq/index.md"], { changeId: "docs-2", generatedAt: "2026-07-28T00:00:00.000Z" });
    await writeDocumentationEvidenceBundle(process.cwd(), output, report);
    await writeFile(path.join(output, "updated-documents.md"), "tampered\n", "utf8");
    const validation = await validateDocumentationEvidenceBundle(output);
    assert.equal(validation.valid, false);
    assert.match(validation.issues.join("\n"), /checksum/);
    await writeFile(path.join(output, "documentation-impact.json"), "{", "utf8");
    assert.match((await validateDocumentationEvidenceBundle(output)).issues.join("\n"), /invalid/);
  } finally { await rm(output, { recursive: true, force: true }); }
});
