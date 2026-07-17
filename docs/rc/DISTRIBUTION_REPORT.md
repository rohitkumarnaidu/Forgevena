# Distribution Report

GitHub Actions tests Windows, Ubuntu, and macOS on Node.js 20 and 22. After all matrices pass, the tag-driven release pipeline generates changelog-based notes, archives, checksums, package-manager manifests, supply-chain evidence, and the GitHub Release. It then publishes npm, GitHub Packages, GHCR, and Docker Hub artifacts. Stable semantic tags become latest releases; prerelease tags remain prereleases. npm publication is isolated behind the protected `npm-release` environment and `NPM_TOKEN`.
