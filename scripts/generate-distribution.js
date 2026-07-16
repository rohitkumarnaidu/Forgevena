import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const root = process.cwd();
const tarball = `${packageJson.name}-${packageJson.version}.tgz`;
const tarballPath = path.join(root, tarball);
const bytes = await readFile(tarballPath);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const version = packageJson.version;
const releaseTag = `v${version}`;
const releaseBase = `https://github.com/rohitkumarnaidu/Work-Space/releases/download/${releaseTag}`;
const output = path.join(root, "dist");
await mkdir(path.join(output, "winget"), { recursive: true });
await mkdir(path.join(output, "homebrew"), { recursive: true });
await mkdir(path.join(output, "chocolatey", "tools"), { recursive: true });
await writeFile(path.join(output, "SHA256SUMS"), `${sha256}  ${tarball}\n`);
await writeFile(path.join(output, "homebrew", "ai-workspace.rb"), homebrew(version, `${releaseBase}/${tarball}`, sha256));
await writeFile(path.join(output, "winget", "RohitKumarNaidu.AIWorkspace.yaml"), winget(version, `${releaseBase}/${tarball}`, sha256));
await writeFile(path.join(output, "chocolatey", "ai-workspace.nuspec"), nuspec(version));
await writeFile(path.join(output, "chocolatey", "tools", "chocolateyinstall.ps1"), chocolatey(version));
console.log(JSON.stringify({ version, tarball, sha256, output }, null, 2));

function homebrew(version, url, sha) { return `class AiWorkspace < Formula\n  desc "Safety-first AI developer platform"\n  homepage "https://github.com/rohitkumarnaidu/Work-Space"\n  url "${url}"\n  sha256 "${sha}"\n  version "${version}"\n  depends_on "node"\n  def install\n    system "npm", "install", *std_npm_args\n    bin.install_symlink libexec/"bin/ai-workspace"\n  end\n  test do\n    assert_match version.to_s, shell_output("#{bin}/ai-workspace version")\n  end\nend\n`; }
function winget(version, url, sha) { return `PackageIdentifier: RohitKumarNaidu.AIWorkspace\nPackageVersion: ${version}\nPackageLocale: en-US\nPublisher: Rohit Kumar Naidu\nPackageName: AI Engineering Workspace\nLicense: MIT\nShortDescription: Safety-first AI developer platform\nInstallers:\n  - Architecture: x64\n    InstallerType: portable\n    InstallerUrl: ${url}\n    InstallerSha256: ${sha.toUpperCase()}\nManifestType: singleton\nManifestVersion: 1.6.0\n`; }
function nuspec(version) { return `<?xml version="1.0"?><package><metadata><id>ai-workspace</id><version>${version}</version><authors>Rohit Kumar Naidu</authors><description>Safety-first AI developer platform.</description><projectUrl>https://github.com/rohitkumarnaidu/Work-Space</projectUrl><license type="expression">MIT</license><requireLicenseAcceptance>false</requireLicenseAcceptance></metadata><files><file src="tools\\**" target="tools" /></files></package>\n`; }
function chocolatey(version) { return `$ErrorActionPreference = 'Stop'\nif (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js and npm are required.' }\nnpm install --global ai-engineering-workspace@${version}\n`; }
