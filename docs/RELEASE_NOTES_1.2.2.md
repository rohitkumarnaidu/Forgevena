# Forgevena 1.2.2

Forgevena 1.2.2 is a backward-compatible distribution and release-hardening update.

## Highlights

- Standalone Windows, Linux, and macOS x64 executables are built and smoke-tested from the signed release source.
- Release verification publishes Markdown and JSON evidence linking every required operating-system and Node.js job.
- Winget references the immutable Windows executable rather than an npm archive.
- Homebrew installs immutable native executables for macOS and Linux.
- Chocolatey verifies the embedded executable checksum and supports the legacy `ai-workspace` alias and clean removal.
- Distribution metadata records artifact hashes, sizes, immutable URLs, and builder provenance.
- Tests fall back to a workspace-local temporary directory when the system temporary directory is restricted.

## Compatibility

- Existing `.ai-workspace` state remains compatible.
- Existing CLI commands and structured output remain compatible.
- Both `forgevena` and `ai-workspace` executables remain supported.
- Native release executables target x64; npm remains the supported installation path for arm64 in this release.

## Install

```powershell
npm install --global forgevena@1.2.2
forgevena version
forgevena doctor
```

Verify downloaded native assets against `RELEASE_SHA256SUMS` before execution.
