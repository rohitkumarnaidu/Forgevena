# Package Publishing

Pushing a verified signed tag matching `v*` starts `.github/workflows/release.yml`. The workflow generates release notes, uploads release assets, creates or updates the GitHub Release, and publishes all configured package channels. Stable tags publish npm and container `latest`; prerelease tags publish npm `next` and never move container `latest`.

## npm

The automated release job uses the protected `npm-release` environment, `NPM_TOKEN`, provenance, and public access. Existing immutable versions are detected and skipped safely. Verify with `npm view forgevena version` and `npm view forgevena dist-tags`.

## GitHub Packages

The automated release job publishes `@rohitkumarnaidu/forgevena` using `GITHUB_TOKEN`. Existing versions are skipped. Consumers configure `@rohitkumarnaidu:registry=https://npm.pkg.github.com`.

## Containers

The automated release job publishes multi-architecture images to GHCR and Docker Hub using the release version. Stable releases also update `latest`. Docker Hub requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

## Retry workflow

Use `Retry Package Publication` only when a release publication job failed after the tag was accepted. Select only the failed registries. It does not create releases or changelog content and must not be used to publish a different source revision under an existing version.

## Homebrew, Winget, and Chocolatey

`npm run release:assets` creates checksummed submission manifests under `dist/`. Submission to external package-manager repositories requires account ownership, review, and their normal pull-request processes.

## Rollback

- npm: `npm deprecate forgevena@<version> "Reason and replacement"`.
- GitHub Packages: retain provenance; mark the release deprecated rather than silently replacing it.
- Containers: publish a corrected version and move `latest` only after validation.
- Package-manager submissions: revert or supersede through each upstream review process.
