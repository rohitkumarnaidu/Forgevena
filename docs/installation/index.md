# Installation Guide

## npm

After publication: `npm install --global forgevena@1.1.0`.

## Verified archive

Install the release archive with `npm install --global ./forgevena-1.1.0.tgz`, then run `forgevena version` and `forgevena doctor`.

## Source checkout

Clone the repository, use Node.js 20.19+, run `npm test`, and execute `node ./bin/forgevena.js help`.

## Containers

Build `Dockerfile.cli`, run the image with `version`, and mount a disposable project directory for modifying commands.

Package-manager submissions for Winget, Chocolatey, and Homebrew are distribution-channel activities performed after the public release URL and checksums exist. See [Publishing Guide](../RELEASE_GUIDE.md) and [Compatibility Matrix](../COMPATIBILITY_MATRIX.md).
