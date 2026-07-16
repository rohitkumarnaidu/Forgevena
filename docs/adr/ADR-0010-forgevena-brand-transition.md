# ADR-0010: Forgevena Brand Transition

## Status

Accepted for version 1.1.

## Decision

Adopt **Forgevena** as the product name and `forgevena` as the preferred package and executable. Use the caption **“Governed engineering from idea to production.”**

Retain `ai-workspace` as a supported executable alias and retain `.ai-workspace/` as the state directory throughout the 1.x release line. Protocol identifiers and persisted schemas remain unchanged unless a separate ADR demonstrates a compatibility-safe need.

## Rationale

The new identity is distinctive and broad enough for project bootstrap, integrations, providers, governance, and release engineering. The compatibility strategy prevents a display-brand change from invalidating scripts or initialized projects.

## Consequences

- New documentation and examples prefer `forgevena`.
- Existing `ai-workspace` scripts continue to run.
- Existing project state requires no migration.
- A future state-directory rename requires a major release, explicit dry-run/apply workflow, backups, and rollback.
- Package and name availability checks reduce risk but do not replace legal trademark clearance.
