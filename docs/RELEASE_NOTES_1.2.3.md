# Forgevena 1.2.3

Forgevena 1.2.3 is a backward-compatible native-runtime packaging fix.

## Highlights

- Standalone executables now include the host-specific Argon2 native binding required by the credential vault.
- Pull-request package validation builds and smoke-tests Windows, Linux, and macOS executables before a release tag can be approved.
- npm Trusted Publishing continues through GitHub Actions OIDC without a long-lived npm publication token.
- The failed immutable `v1.2.2` tag remains unchanged and did not publish an npm package or GitHub Release.

## Compatibility

- Existing `.ai-workspace` state remains compatible.
- Existing CLI commands and structured output remain compatible.
- Both `forgevena` and `ai-workspace` executables remain supported.
- Native release executables target x64; npm remains the supported arm64 installation path.

## Install

```powershell
npm install --global forgevena@1.2.3
forgevena version
forgevena doctor
```

Verify downloaded native assets against `RELEASE_SHA256SUMS` before execution.
