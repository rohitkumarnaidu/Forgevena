import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const defaultPackage = require("../package.json");
const repositoryUrl = "https://github.com/rohitkumarnaidu/Forgevena";

export async function generateDistribution(root = process.cwd(), packageJson = defaultPackage) {
  const version = packageJson.version;
  const releaseTag = `v${version}`;
  const releaseBase = `${repositoryUrl}/releases/download/${releaseTag}`;
  const output = path.join(root, "dist");
  const tarballName = `${packageJson.name}-${version}.tgz`;
  const artifacts = {
    npm: await artifact(path.join(root, tarballName), tarballName),
    windows: await artifact(path.join(output, "standalone", "forgevena-win-x64.exe"), "forgevena-win-x64.exe"),
    linux: await artifact(path.join(output, "standalone", "forgevena-linux-x64"), "forgevena-linux-x64"),
    macos: await artifact(path.join(output, "standalone", "forgevena-macos-x64"), "forgevena-macos-x64"),
  };

  await mkdir(path.join(output, "winget"), { recursive: true });
  await mkdir(path.join(output, "homebrew"), { recursive: true });
  await mkdir(path.join(output, "chocolatey", "tools"), { recursive: true });

  const sums = Object.values(artifacts)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(({ sha256, name }) => `${sha256}  ${name}`)
    .join("\n");
  await writeFile(path.join(output, "SHA256SUMS"), `${sums}\n`);
  await writeFile(path.join(output, "distribution-manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    package: packageJson.name,
    version,
    releaseTag,
    repository: repositoryUrl,
    artifacts: Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, {
      name: value.name,
      size: value.size,
      sha256: value.sha256,
      url: `${releaseBase}/${value.name}`,
    }])),
    builder: { name: "@yao-pkg/pkg", version: "6.21.0", runtime: "node22" },
  }, null, 2)}\n`);
  await writeFile(path.join(output, "homebrew", "forgevena.rb"), homebrew(version, releaseBase, artifacts));
  await writeFile(path.join(output, "winget", "RohitKumarNaidu.Forgevena.yaml"), wingetVersion(version));
  await writeFile(path.join(output, "winget", "RohitKumarNaidu.Forgevena.installer.yaml"), wingetInstaller(version, releaseBase, artifacts.windows));
  await writeFile(path.join(output, "winget", "RohitKumarNaidu.Forgevena.locale.en-US.yaml"), wingetDefaultLocale(version));
  await copyFile(artifacts.windows.path, path.join(output, "chocolatey", "tools", "forgevena.exe"));
  await copyFile(path.join(root, "LICENSE"), path.join(output, "chocolatey", "tools", "LICENSE.txt"));
  await writeFile(path.join(output, "chocolatey", "forgevena.nuspec"), nuspec(version));
  await writeFile(path.join(output, "chocolatey", "tools", "chocolateyinstall.ps1"), chocolateyInstall(artifacts.windows.sha256));
  await writeFile(path.join(output, "chocolatey", "tools", "chocolateyuninstall.ps1"), chocolateyUninstall());
  await writeFile(path.join(output, "chocolatey", "tools", "VERIFICATION.txt"), verification(version, releaseBase, artifacts.windows));

  return { version, releaseTag, artifacts, output };
}

async function artifact(filePath, name) {
  const bytes = await readFile(filePath);
  return { name, path: filePath, size: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

function homebrew(version, releaseBase, artifacts) {
  return `class Forgevena < Formula
  desc "Governed engineering from idea to production"
  homepage "${repositoryUrl}"
  version "${version}"
  license "MIT"

  on_macos do
    url "${releaseBase}/${artifacts.macos.name}", using: :nounzip
    sha256 "${artifacts.macos.sha256}"
  end

  on_linux do
    url "${releaseBase}/${artifacts.linux.name}", using: :nounzip
    sha256 "${artifacts.linux.sha256}"
  end

  depends_on arch: :x86_64

  def install
    chmod 0755, cached_download
    bin.install cached_download => "forgevena"
    bin.install_symlink bin/"forgevena" => "ai-workspace"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/forgevena version")
  end
end
`;
}

function wingetVersion(version) {
  return `# yaml-language-server: $schema=https://aka.ms/winget-manifest.version.1.12.0.schema.json
PackageIdentifier: RohitKumarNaidu.Forgevena
PackageVersion: ${version}
DefaultLocale: en-US
ManifestType: version
ManifestVersion: 1.12.0
`;
}

function wingetInstaller(version, releaseBase, windows) {
  return `# yaml-language-server: $schema=https://aka.ms/winget-manifest.installer.1.12.0.schema.json
PackageIdentifier: RohitKumarNaidu.Forgevena
PackageVersion: ${version}
InstallerType: portable
Commands:
  - forgevena
Installers:
  - Architecture: x64
    InstallerUrl: ${releaseBase}/${windows.name}
    InstallerSha256: ${windows.sha256.toUpperCase()}
ManifestType: installer
ManifestVersion: 1.12.0
`;
}

function wingetDefaultLocale(version) {
  return `# yaml-language-server: $schema=https://aka.ms/winget-manifest.defaultLocale.1.12.0.schema.json
PackageIdentifier: RohitKumarNaidu.Forgevena
PackageVersion: ${version}
PackageLocale: en-US
Publisher: Rohit Kumar Naidu
PublisherUrl: ${repositoryUrl}
PublisherSupportUrl: ${repositoryUrl}/issues
PackageName: Forgevena
PackageUrl: ${repositoryUrl}
License: MIT
LicenseUrl: ${repositoryUrl}/blob/v${version}/LICENSE
ShortDescription: Governed engineering from idea to production
ReleaseNotesUrl: ${repositoryUrl}/releases/tag/v${version}
ManifestType: defaultLocale
ManifestVersion: 1.12.0
`;
}

function nuspec(version) {
  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>forgevena</id>
    <version>${version}</version>
    <title>Forgevena</title>
    <authors>Rohit Kumar Naidu</authors>
    <owners>rohitkumarnaidu</owners>
    <description>Governed engineering from idea to production.</description>
    <summary>Enterprise developer platform for governed project delivery.</summary>
    <projectUrl>${repositoryUrl}</projectUrl>
    <packageSourceUrl>${repositoryUrl}</packageSourceUrl>
    <docsUrl>https://rohitkumarnaidu.github.io/Forgevena/</docsUrl>
    <bugTrackerUrl>${repositoryUrl}/issues</bugTrackerUrl>
    <iconUrl>https://rohitkumarnaidu.github.io/Forgevena/assets/favicon.svg</iconUrl>
    <releaseNotes>${repositoryUrl}/releases/tag/v${version}</releaseNotes>
    <licenseUrl>${repositoryUrl}/blob/v${version}/LICENSE</licenseUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <tags>forgevena developer-platform cli ai devops</tags>
  </metadata>
  <files><file src="tools\**" target="tools" /></files>
</package>
`;
}

function chocolateyInstall(sha256) {
  return `$ErrorActionPreference = 'Stop'
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$primary = Join-Path $toolsDir 'forgevena.exe'
$legacy = Join-Path $toolsDir 'ai-workspace.exe'
$actual = (Get-FileHash -LiteralPath $primary -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne '${sha256}') { throw "Forgevena checksum verification failed. Expected ${sha256}; received $actual." }
Copy-Item -LiteralPath $primary -Destination $legacy -Force
`;
}

function chocolateyUninstall() {
  return `$ErrorActionPreference = 'Stop'
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$legacy = Join-Path $toolsDir 'ai-workspace.exe'
if (Test-Path -LiteralPath $legacy) { Remove-Item -LiteralPath $legacy -Force }
`;
}

function verification(version, releaseBase, windows) {
  return `VERIFICATION

Version: ${version}
Source: ${releaseBase}/${windows.name}
SHA-256: ${windows.sha256}

The package install script verifies the embedded executable before creating the legacy ai-workspace alias.
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await generateDistribution();
  console.log(JSON.stringify(result, null, 2));
}
