# Installation Guide

## npm

Install the current stable release with `npm install --global forgevena@1.2.1`.

## Verified archive

Download `forgevena-1.2.1.tgz` and `RELEASE_SHA256SUMS` from the [latest release](https://github.com/rohitkumarnaidu/Forgevena/releases/latest), verify the checksum, install with `npm install --global ./forgevena-1.2.1.tgz`, then run `forgevena version` and `forgevena doctor`.

## Source checkout

Clone the repository, use Node.js 20.19+, run `npm test`, and execute `node ./bin/forgevena.js help`.

## Containers

Build `Dockerfile.cli`, run the image with `version`, and mount a disposable project directory for modifying commands.

Package-manager submissions for Winget, Chocolatey, and Homebrew are distribution-channel activities performed after the public release URL and checksums exist. See [Publishing Guide](../RELEASE_GUIDE.md) and [Compatibility Matrix](../COMPATIBILITY_MATRIX.md).
