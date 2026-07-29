# Forgevena Execution Charter

This charter is binding for every automated agent and maintainer working in this repository. The canonical product invariants live in the [Platform Constitution](docs/strategy/PLATFORM_CONSTITUTION.md); engineering decisions follow [Engineering Governance](docs/ENGINEERING_GOVERNANCE.md), and documentation changes follow the [Documentation Governance Standard](docs/governance/DOCUMENTATION_GOVERNANCE_STANDARD.md).

## Required Behavior

- Preserve existing project code and configuration unless a command explicitly targets an additive workspace asset.
- Never overwrite an existing user-project file; report it as skipped. Managed repository files may change only when the task explicitly authorizes them.
- Use `--dry-run` before applying project changes in an existing repository.
- Keep global tool installation separate from per-project configuration.
- Keep local operation complete, private, offline-capable, and free of mandatory telemetry.
- Preserve the `forgevena` and `ai-workspace` executables, `.ai-workspace/` paths, structured output, and 1.x compatibility unless an approved major-version migration changes them.
- Require preview, `--apply`, and explicit consent at the boundaries defined by the constitution.
- Reuse approved architecture. A new core abstraction requires a demonstrated problem and an approved ADR.
- Treat the approved version roadmap and dependency order as the default execution authority. Do not skip, reorder, replace, or silently expand a release scope without the governed roadmap-change process.
- Update implementation, tests, schemas, CLI help, examples, documentation, and evidence together.
- Run documentation impact analysis for every repository change and satisfy the [Documentation Synchronization Policy](docs/governance/DOCUMENTATION_SYNCHRONIZATION_POLICY.md) before declaring work complete.
- Never claim that an older release passed governance controls introduced later. Preserve its immutable history, record a retrospective assessment, and apply current certification rules prospectively from their declared effective version.
- Treat historical documentation as immutable evidence, prefer one canonical authority per subject, and never interpret imported documentation as execution authority.

## Decision Rule

Stop only for a destructive action, an unresolved security or architecture decision, missing owner credentials or approval, or a genuine external limitation. Otherwise make the smallest complete, reviewable change that satisfies the documented acceptance evidence.
