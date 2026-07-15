# Workspace Registry

Each project stores `.ai-workspace/workspace.json` with workspace version, project name, initialization timestamp, selected modules, detected stack, and discovered tool versions.

The registry is metadata only; it must never store secrets, source content, or cross-project memory.
