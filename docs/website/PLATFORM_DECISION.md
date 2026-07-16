# Documentation Platform Decision

## Decision

Use MkDocs Material with Mike versioning.

## Comparison

| Criterion | MkDocs Material | Docusaurus |
|---|---|---|
| Existing Markdown reuse | Direct | Direct with MDX/React conventions |
| Runtime/toolchain | Python build only | Node/React build |
| Search | Built-in client index | Plugin or hosted service |
| Mermaid/dark/navigation | Mature extensions/theme | Mature React integrations |
| Versioning | Mike branch-based versions | Built-in copied version trees |
| Custom application UI | Limited | Strong |
| Maintenance for this CLI | Lower | Higher |

The repository needs documentation publishing, not a React application. MkDocs minimizes dependency and contributor overhead while satisfying search, accessibility, responsive navigation, Git metadata, Mermaid, code copy, tabs, callouts, and version selection.

## Consequences

Python documentation dependencies are isolated in `website/requirements.txt`. Production builds use `--strict`. Mike writes only to the documentation publication branch after maintainer approval.
