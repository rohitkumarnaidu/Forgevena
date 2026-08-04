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
  assert.match(workflow, /Capture release verification evidence/);
  assert.match(workflow, /release-verification\.json/);
  assert.match(workflow, /RELEASE_VERIFICATION\.md/);
  assert.match(workflow, /standalone:/);
  assert.match(workflow, /node22-win-x64/);
  assert.match(workflow, /node22-linux-x64/);
  assert.match(workflow, /node22-macos-x64/);
  assert.match(workflow, /macos-15-intel/);
  assert.match(workflow, /Smoke-test standalone executable/);
  assert.match(workflow, /forgevena-win-x64\.exe/);
  assert.match(workflow, /distribution-manifest\.json/);
  assert.match(workflow, /actions\/runs\/\$\{GITHUB_RUN_ID\}\/jobs/);
  assert.match(workflow, /npm install --global npm@11\.5\.1/);
  assert.match(workflow, /node-version: 22\.14\.0/);
  assert.match(workflow, /npm publish --tag "\$\{CHANNEL\}" --provenance --access public/);
  assert.doesNotMatch(workflow, /secrets\.NPM_TOKEN/);
  assert.match(workflow, /npm publish --ignore-scripts --registry https:\/\/npm\.pkg\.github\.com/);
  assert.match(workflow, /ghcr\.io\/rohitkumarnaidu\/forgevena/);
  assert.match(workflow, /if: steps\.registries\.outputs\.dockerhub == 'true'/);
  assert.match(workflow, /Docker Hub credentials are absent; publishing GHCR only/);
  assert.match(workflow, /make_latest: \$\{\{ steps\.channel\.outputs\.make_latest \}\}/);
  assert.doesNotMatch(workflow, /prerelease: true/);
});

test("package validation smoke-tests host-native executables before tagging", async () => {
  const workflow = await readFile(new URL("../.github/workflows/package-validation.yml", import.meta.url), "utf8");
  const builder = await readFile(new URL("../scripts/build-standalone.js", import.meta.url), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(workflow, /node22-win-x64/);
  assert.match(workflow, /node22-linux-x64/);
  assert.match(workflow, /node22-macos-x64/);
  assert.match(workflow, /macos-15-intel/);
  assert.match(workflow, /Smoke-test standalone executable/);
  assert.match(builder, /argon2-win32-x64-msvc/);
  assert.match(builder, /argon2-linux-x64-gnu/);
  assert.match(builder, /argon2-darwin-x64/);
  assert.match(builder, /copyFile\(source, destination\)/);
  assert.ok(packageJson.pkg.assets.includes("node_modules/@node-rs/argon2/**/*"));
});

test("documentation CI checks the complete canonical documentation set", async () => {
  const workflow = await readFile(new URL("../.github/workflows/docs.yml", import.meta.url), "utf8");
  const spelling = await readFile(new URL("../cspell.json", import.meta.url), "utf8");
  assert.match(workflow, /incremental_files_only: false/);
  assert.match(spelling, /docs\/branding\/BRAND_DISCOVERY\.md/);
  assert.match(spelling, /embeddinggemma/);
});

test("public entry points reference the current stable release", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const releases = await readFile(new URL("../docs/releases/index.md", import.meta.url), "utf8");
  const stableVersion = releases.match(/^- \[(\d+\.\d+\.\d+)\]/m)?.[1];
  assert.ok(stableVersion, "release index must identify the current stable version");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const homepage = await readFile(new URL("../docs/index.md", import.meta.url), "utf8");
  const gettingStarted = await readFile(new URL("../docs/getting-started/index.md", import.meta.url), "utf8");
  const installation = await readFile(new URL("../docs/installation/index.md", import.meta.url), "utf8");
  const docsReadme = await readFile(new URL("../docs/README.md", import.meta.url), "utf8");
  for (const contents of [readme, homepage, gettingStarted, installation, docsReadme]) {
    assert.match(contents, new RegExp(stableVersion.replaceAll(".", "\\.")));
    assert.doesNotMatch(contents, /npm install --global forgevena@1\.[01]\.0/);
  }
  if (packageJson.version.includes("-")) {
    assert.notEqual(packageJson.version, stableVersion);
  }
});

test("secondary registries publish without mutating release validation", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");

  assert.doesNotMatch(workflow, /publish_npm/);
  assert.doesNotMatch(workflow, /registry\.npmjs\.org/);
  assert.match(workflow, /npm pkg set name=@rohitkumarnaidu\/forgevena/);
  assert.match(workflow, /npm publish --ignore-scripts --registry https:\/\/npm\.pkg\.github\.com/);
  assert.match(workflow, /node -e "console\.log\('version=' \+ require\('\.\/package\.json'\)\.version\)" >> "\$GITHUB_OUTPUT"/);
  assert.doesNotMatch(workflow, /node -p \\"require\('\.\/package\.json'\)\.version\"/);
});

test("manual secondary publication is explicitly retry-only", async () => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  assert.match(workflow, /name: Retry Package Publication/);
  assert.match(workflow, /Retry scoped GitHub Packages publication/);
  assert.match(workflow, /Retry container publication to GHCR and Docker Hub/);
  assert.doesNotMatch(workflow, /npm-release/);
});
