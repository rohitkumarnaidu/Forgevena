# Installation Guide

## npm

Install the current stable release with `npm install --global forgevena@1.2.3`.

## Verified archive

Download `forgevena-1.2.3.tgz` and `RELEASE_SHA256SUMS` from the [latest release](https://github.com/rohitkumarnaidu/Forgevena/releases/latest), verify the checksum, install with `npm install --global ./forgevena-1.2.3.tgz`, then run `forgevena version` and `forgevena doctor`.

## Standalone executables

The `v1.2.3` release publishes `forgevena-win-x64.exe`, `forgevena-linux-x64`, and `forgevena-macos-x64`. Download the matching executable and `RELEASE_SHA256SUMS`, verify SHA-256 before execution, and grant execute permission on Linux or macOS. npm remains the supported arm64 installation path for this release.

## Source checkout

Clone the repository, use Node.js 20.19+, run `npm test`, and execute `node ./bin/forgevena.js help`.

## Containers

Build `Dockerfile.cli`, run the image with `version`, and mount a disposable project directory for modifying commands.

Homebrew, Winget, and Chocolatey bundles are generated from the same immutable native executables. Submission to their external repositories occurs only after the public release URL and checksums exist. See [Publishing Guide](../RELEASE_GUIDE.md) and [Compatibility Matrix](../COMPATIBILITY_MATRIX.md).
