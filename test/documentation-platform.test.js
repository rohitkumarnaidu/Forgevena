import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

test("MkDocs platform includes required production features", async () => {
  const config = await readFile("website/mkdocs.yml", "utf8");
  for (const feature of ["material", "search:", "provider: mike", "navigation.path", "content.code.copy", "pymdownx.superfences", "git-revision-date-localized"]) assert.match(config, new RegExp(feature.replaceAll(".", "\\.")));
  await Promise.all(["website/requirements.txt", "docs/404.md", "docs/versions.json", "docs/assets/stylesheets/extra.css", "docs/assets/javascripts/extra.js"].map((file) => access(file)));
});

test("documentation workflows cover quality and publication", async () => {
  await Promise.all(["docs.yml", "docs-deploy.yml", "markdown-lint.yml", "broken-links.yml", "changelog.yml", "release.yml", "pages.yml"].map((name) => access(`.github/workflows/${name}`)));
});

test("GitHub Pages installs locked Node dependencies before validation", async () => {
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");
  const install = workflow.indexOf("npm ci --ignore-scripts");
  const validation = workflow.indexOf("node scripts/validate-docs.js");
  assert.notEqual(install, -1);
  assert.equal(install < validation, true);
  assert.match(workflow, /\.github\/workflows\/pages\.yml/);
  assert.match(workflow, /package-lock\.json/);
});
