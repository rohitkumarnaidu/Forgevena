# Breaking Changes Report — 1.0.0

Version 1.0.0 establishes the first stable public contract. There are no breaking changes relative to an earlier stable major release.

Pre-1.0 workspaces must run `upgrade --dry-run` and review the migration plan before applying schema version 2. Existing files remain untouched. Unsupported or renamed experimental pre-release fields are handled only through documented migration paths; no guarantee is made for hand-edited internal registry state.

Future breaking changes require deprecation notice, migration guidance, compatibility evidence, and a major version.
