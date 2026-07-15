# ADR 0001: Additive Workspace Assets

## Decision

The workspace creates only absent, platform-owned assets. Existing files, application code, manifests, and configuration are reported as skipped.

## Consequences

`ai init` is safe for existing repositories. Format-aware merging is deferred until a separate ADR proves a non-destructive design.
