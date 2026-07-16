# Security Model

Default to least privilege, local-only state, explicit network actions, and no automatic deletion. Validate paths before writes; protect against traversal; do not execute shell strings constructed from user input.

Third-party tool installation is opt-in and follows official instructions. Dependency provenance and license review are release gates.

Live provider, MCP, and cloud requests are disabled by dry-run defaults. Secrets are environment references, request/response content is not logged, dashboard access is loopback/token protected, remote MCP uses HTTPS, and remote executable plugin code is rejected.

Managed development credentials may use isolated ignored files or AES-256-GCM encryption. The encryption key must come from `AI_WORKSPACE_CREDENTIAL_KEY` supplied by an OS credential store or approved secret manager and is never persisted. Rotation archives managed prior values; removal quarantines them. Safe exports reject secret, token, password, API-key, ciphertext, and private-key fields.
