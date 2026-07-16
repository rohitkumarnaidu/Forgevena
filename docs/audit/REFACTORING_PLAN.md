# Refactoring Plan

## Constraints

- No command, JSON output, registry, template, or safety behavior may change without compatibility tests.
- Every refactor begins with characterization tests.
- Registry changes require migrations and rollback evidence.
- Security-sensitive changes require an ADR and threat review.

## Planned Passes

### Pass 1: Safety Foundations

- Add centralized redaction.
- Add atomic write/rename persistence.
- Add strict schema/corruption errors.
- Add transactional credential replacement and recovery.

### Pass 2: Command Boundaries

- Extract credential, provider, MCP, plugin, cloud, Docker, integration, and bootstrap handlers from `src/cli.js`.
- Introduce shared option parsing while preserving help and exit codes.

### Pass 3: UI Boundaries

- Extract dashboard HTML/CSS/client JavaScript.
- Separate API routing from HTTP lifecycle.
- Add browser, accessibility, CSP, and CSRF regression tests.

### Pass 4: Domain Validation

- Enforce semantic versions and plugin compatibility.
- Add provider retry metadata and `Retry-After` handling.
- Add cloud artifact schema/stack validation.
- Add required/optional health policies.

### Pass 5: Developer Experience

- Extract templates into versioned resources.
- Publish JSON Schemas and shell completions.
- Add coverage, mutation, and performance gates.

No refactoring was performed as part of the audit.
