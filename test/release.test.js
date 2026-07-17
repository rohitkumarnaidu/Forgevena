import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { releaseChecksum, verifyReleasePackage } from "../src/release.js";

test("release package uses an explicit cross-platform allowlist", async () => {
  const result = await verifyReleasePackage(process.cwd());
  assert.equal(result.valid, true, result.issues.join("\n"));
  assert.deepEqual(result.operatingSystems, ["darwin", "linux", "win32"]);
  assert.ok(result.files.includes("src/"));
});

test("release checksums are deterministic SHA-256 values", async () => {
  const contents = await readFile(new URL("../package.json", import.meta.url));
  assert.match(releaseChecksum(contents), /^[a-f0-9]{64}$/);
  assert.equal(releaseChecksum(contents), releaseChecksum(contents));
});

test("publication metadata derives the current version and canonical repository", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  const generator = await readFile(new URL("../scripts/generate-distribution.js", import.meta.url), "utf8");

  assert.match(workflow, /require\('\.\/package\.json'\)\.version/);
  assert.match(workflow, /type=raw,value=\$\{\{ steps\.package\.outputs\.version \}\}/);
  assert.doesNotMatch(workflow, /type=raw,value=1\.1\.0/);
  assert.match(generator, /https:\/\/github\.com\/rohitkumarnaidu\/Forgevena/);
  assert.doesNotMatch(generator, /rohitkumarnaidu\/Work-Space/);
});

test("signed tags automate changelog, release, and package publication", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

  assert.match(workflow, /OUTPUT: dist\/RELEASE_NOTES\.md/);
  assert.match(workflow, /body_path: dist\/RELEASE_NOTES\.md/);
  assert.match(workflow, /tag_name: \$\{\{ env\.RELEASE_REF \}\}/);
  assert.match(workflow, /git show "\$\{GITHUB_SHA\}:cliff\.toml" > \.release-cliff\.toml/);
  assert.match(workflow, /release_tag:/);
  assert.match(workflow, /publish_packages:/);
  assert.match(workflow, /ref: \$\{\{ env\.RELEASE_REF \}\}/);
  assert.match(workflow, /forgevena-\$\{VERSION\}-homebrew\.tar\.gz/);
  assert.match(workflow, /forgevena-\$\{VERSION\}-winget\.tar\.gz/);
  assert.match(workflow, /forgevena-\$\{VERSION\}-chocolatey\.tar\.gz/);
  assert.match(workflow, /forgevena-\$\{VERSION\}-sbom\.cdx\.json/);
  assert.match(workflow, /RELEASE_SHA256SUMS/);
  assert.match(workflow, /npm publish --tag "\$\{CHANNEL\}" --provenance --access public/);
  assert.match(workflow, /npm publish --ignore-scripts --registry https:\/\/npm\.pkg\.github\.com/);
  assert.match(workflow, /ghcr\.io\/rohitkumarnaidu\/forgevena/);
  assert.match(workflow, /if: steps\.registries\.outputs\.dockerhub == 'true'/);
  assert.match(workflow, /Docker Hub credentials are absent; publishing GHCR only/);
  assert.match(workflow, /make_latest: \$\{\{ steps\.channel\.outputs\.make_latest \}\}/);
  assert.doesNotMatch(workflow, /prerelease: true/);
});

test("public entry points reference the current stable release", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const homepage = await readFile(new URL("../docs/index.md", import.meta.url), "utf8");
  const gettingStarted = await readFile(new URL("../docs/getting-started/index.md", import.meta.url), "utf8");
  const installation = await readFile(new URL("../docs/installation/index.md", import.meta.url), "utf8");
  const docsReadme = await readFile(new URL("../docs/README.md", import.meta.url), "utf8");
  for (const contents of [readme, homepage, gettingStarted, installation, docsReadme]) {
    assert.match(contents, /1\.2\.1/);
    assert.doesNotMatch(contents, /npm install --global forgevena@1\.[01]\.0/);
  }
});

test("secondary registries publish without mutating release validation", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");

  assert.match(workflow, /npm pkg set name=@rohitkumarnaidu\/forgevena/);
  assert.match(workflow, /npm publish --ignore-scripts --registry https:\/\/npm\.pkg\.github\.com/);
  assert.match(workflow, /node -e "console\.log\('version=' \+ require\('\.\/package\.json'\)\.version\)" >> "\$GITHUB_OUTPUT"/);
  assert.doesNotMatch(workflow, /node -p \\"require\('\.\/package\.json'\)\.version\"/);
});

test("manual package publication is explicitly retry-only", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  assert.match(workflow, /name: Retry Package Publication/);
  assert.match(workflow, /Retry npm publication after a failed automated release job/);
});
