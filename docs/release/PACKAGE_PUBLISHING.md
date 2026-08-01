# Package Publishing

Pushing a verified signed tag matching `v*` starts `.github/workflows/release.yml`. The workflow generates release notes; builds and smoke-tests native Windows, Linux, and macOS executables; uploads the npm archive, checksums, SBOM, provenance, release-verification reports, distribution manifest, and package-manager bundles; creates or updates the GitHub Release; and publishes all configured package channels. Stable tags publish npm and container `latest`; prerelease tags publish npm `next` and never move container `latest`.

Maintainers can repair an existing immutable tag by manually running `Automated Release` with `release_tag` set to that tag and `publish` enabled. Leave `publish_packages` disabled when only release notes or downloads need repair. The workflow checks out the tag itself, not `main`, and skips package versions that already exist when registry retries are explicitly enabled.

Release verification is generated only after all six Windows, Ubuntu, and macOS jobs for Node.js 20 and 22 pass. `RELEASE_VERIFICATION.md` is appended to the release description, while `release-verification.json` provides a stable machine-readable evidence contract. Both files link to the exact GitHub Actions run and jobs.

## npm

The automated release job uses the protected `npm-release` environment and npm Trusted Publishing through GitHub Actions OIDC. `release.yml` is the only authorized npm publisher, uses Node.js 22.14.0 with npm 11.5.1, requests `id-token: write`, and does not read a long-lived npm publication token. Existing immutable versions are detected and skipped safely. Verify with `npm view forgevena version` and `npm view forgevena dist-tags`.

## GitHub Packages

The automated release job publishes `@rohitkumarnaidu/forgevena` using `GITHUB_TOKEN`. Existing versions are skipped. Consumers configure `@rohitkumarnaidu:registry=https://npm.pkg.github.com`.

## Containers

The automated release job publishes multi-architecture images to GHCR and Docker Hub using the release version. Stable releases also update `latest`. Docker Hub requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

## Retry workflow

Use `Retry Package Publication` only for GitHub Packages or container failures. To retry npm publication, run `Automated Release` with the immutable `release_tag`, `publish` enabled, and `publish_packages` enabled; this preserves the single trusted workflow identity required by npm. Neither workflow may publish a different source revision under an existing version.

## Homebrew, Winget, and Chocolatey

`npm run release:assets` consumes the npm archive and three native x64 executables under `dist/standalone/`, then creates checksummed submission manifests under `dist/`. Homebrew consumes immutable macOS/Linux binaries, Winget consumes the Windows executable, and Chocolatey embeds the same checksum-verified Windows executable with install and uninstall scripts. Submission to external package-manager repositories requires account ownership, review, and their normal pull-request processes.

Current external evidence:

- Winget `1.2.3` was accepted and published through [microsoft/winget-pkgs PR 404506](https://github.com/microsoft/winget-pkgs/pull/404506). Maintainers verify propagation with `winget source update` and `winget show --id RohitKumarNaidu.Forgevena --exact`.
- Chocolatey `1.2.3` passed package validation and automated installation testing. It remains under human moderation at the [Chocolatey package page](https://community.chocolatey.org/packages/forgevena/1.2.3); no repository change can accelerate that external review.
- The Homebrew tap publishes `1.3.0`. External channel versions may trail npm and must be reported independently rather than described as one synchronized release.

## Rollback

- npm: `npm deprecate forgevena@<version> "Reason and replacement"`.
- GitHub Packages: retain provenance; mark the release deprecated rather than silently replacing it.
- Containers: publish a corrected version and move `latest` only after validation.
- Package-manager submissions: revert or supersede through each upstream review process.
