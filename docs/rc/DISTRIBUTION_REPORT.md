# Distribution Report

GitHub Actions tests Windows, Ubuntu, and macOS on Node.js 20 and 22. After all matrices pass, the artifact job creates the npm archive, checksums, and package-manager manifests and uploads them. Tagged releases create a prerelease. npm publication is isolated behind the protected `npm-release` environment and `NPM_TOKEN`; no publication was executed locally.
