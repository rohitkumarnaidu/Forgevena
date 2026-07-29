import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { renderReleaseRetrospective, validateReleaseRetrospectives } from "../src/release-retrospective.js";

const root = process.cwd();
const ledgerPath = path.join(root, "docs/governance/release-retrospectives.json");
const reportPath = path.join(root, "docs/reports/HISTORICAL_RELEASE_GOVERNANCE_RETROSPECTIVE.md");
const document = JSON.parse(await readFile(ledgerPath, "utf8"));
const validation = validateReleaseRetrospectives(document);
if (!validation.valid) {
  console.error(validation.issues.join("\n"));
  process.exitCode = 1;
} else if (process.argv.includes("--write")) {
  await writeFile(reportPath, renderReleaseRetrospective(document), "utf8");
  console.log(`Wrote ${path.relative(root, reportPath)} for ${validation.releasesChecked} releases.`);
} else {
  const expected = renderReleaseRetrospective(document).replace(/\r\n/g, "\n");
  const actual = (await readFile(reportPath, "utf8")).replace(/\r\n/g, "\n");
  if (actual !== expected) {
    console.error(`${path.relative(root, reportPath)} is stale. Run npm run governance:releases:write.`);
    process.exitCode = 1;
  } else console.log(`Validated ${validation.releasesChecked} historical release assessments.`);
}

