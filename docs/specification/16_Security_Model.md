# Security Model

Default to least privilege, local-only state, explicit network actions, and no automatic deletion. Validate paths before writes; protect against traversal; do not execute shell strings constructed from user input.

Third-party tool installation is opt-in and follows official instructions. Dependency provenance and license review are release gates.
