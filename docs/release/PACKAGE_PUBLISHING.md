# Package Publishing

## npm

Run the `Publish Packages` workflow with `publish_npm` after configuring the protected `npm-release` environment and `NPM_TOKEN`. Verify with `npm view forgevena version`.

## GitHub Packages

The workflow publishes `@rohitkumarnaidu/forgevena` using `GITHUB_TOKEN`. Consumers configure `@rohitkumarnaidu:registry=https://npm.pkg.github.com`.

## Containers

The workflow publishes multi-architecture images to GHCR and Docker Hub only when `publish_containers` is selected and Docker Hub credentials exist.

## Homebrew, Winget, and Chocolatey

`npm run release:assets` creates checksummed submission manifests under `dist/`. Submission to external package-manager repositories requires account ownership, review, and their normal pull-request processes.

## Rollback

- npm: `npm deprecate forgevena@<version> "Reason and replacement"`.
- GitHub Packages: retain provenance; mark the release deprecated rather than silently replacing it.
- Containers: publish a corrected version and move `latest` only after validation.
- Package-manager submissions: revert or supersede through each upstream review process.
