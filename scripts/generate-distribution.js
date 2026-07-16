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
await writeFile(path.join(output, "homebrew", "forgevena.rb"), homebrew(version, `${releaseBase}/${tarball}`, sha256));
await writeFile(path.join(output, "winget", "RohitKumarNaidu.Forgevena.yaml"), winget(version, `${releaseBase}/${tarball}`, sha256));
await writeFile(path.join(output, "chocolatey", "forgevena.nuspec"), nuspec(version));
await writeFile(path.join(output, "chocolatey", "tools", "chocolateyinstall.ps1"), chocolatey(version));
console.log(JSON.stringify({ version, tarball, sha256, output }, null, 2));

function homebrew(formulaVersion, url, sha) {
  return `class Forgevena < Formula\n  desc "Governed engineering from idea to production"\n  homepage "https://github.com/rohitkumarnaidu/Work-Space"\n  url "${url}"\n  sha256 "${sha}"\n  version "${formulaVersion}"\n  depends_on "node"\n  def install\n    system "npm", "install", *std_npm_args\n    bin.install_symlink libexec/"bin/forgevena"\n    bin.install_symlink libexec/"bin/ai-workspace"\n  end\n  test do\n    assert_match version.to_s, shell_output("#{bin}/forgevena version")\n  end\nend\n`;
}

function winget(manifestVersion, url, sha) {
  return `PackageIdentifier: RohitKumarNaidu.Forgevena\nPackageVersion: ${manifestVersion}\nPackageLocale: en-US\nPublisher: Rohit Kumar Naidu\nPackageName: Forgevena\nLicense: MIT\nShortDescription: Governed engineering from idea to production\nInstallers:\n  - Architecture: x64\n    InstallerType: portable\n    InstallerUrl: ${url}\n    InstallerSha256: ${sha.toUpperCase()}\nManifestType: singleton\nManifestVersion: 1.6.0\n`;
}

function nuspec(packageVersion) {
  return `<?xml version="1.0"?><package><metadata><id>forgevena</id><version>${packageVersion}</version><authors>Rohit Kumar Naidu</authors><description>Governed engineering from idea to production.</description><projectUrl>https://github.com/rohitkumarnaidu/Work-Space</projectUrl><license type="expression">MIT</license><requireLicenseAcceptance>false</requireLicenseAcceptance></metadata><files><file src="tools\\**" target="tools" /></files></package>\n`;
}

function chocolatey(packageVersion) {
  return `$ErrorActionPreference = 'Stop'\nif (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js and npm are required.' }\nnpm install --global forgevena@${packageVersion}\n`;
}
