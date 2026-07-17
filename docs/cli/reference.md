# CLI Reference

## Global safety flags

| Flag | Meaning |
|---|---|
| `--dry-run` | Preview; default for modifying commands. |
| `--apply` | Permit local changes. |
| `--yes` | Confirm an external or destructive managed action. |
| `--non-interactive` | Disable prompts; required approvals must be supplied explicitly. |
| `--verbose` | Include detection and planning details. |
| `--merge skip|merge|replace` | Requested collision policy; all collisions remain skip-only. |
| `--skip <items>` | Comma-separated modules or paths to omit. |

## Command catalog

| Command | Arguments and common flags | Result |
|---|---|---|
| `doctor` | `--verbose` | Environment and project diagnostics. |
| `status` | none | Registry and project status. |
| `validate` | none | Bootstrap and managed-state validation. |
| `version` | none | Platform and schema versions. |
| `create <name>` | `--template`, `--provider`, `--output`, safety flags | New additive project plan/application. |
| `init` | safety flags | Initialize current repository additively. |
| `add <module>` | safety flags | Add missing module-owned assets. |
| `remove <module>` | none | Reports unsupported; never deletes project files. |
| `update` | safety flags | Add newly managed missing assets. |
| `rollback [operation]` | `--apply --yes` | Remove unchanged files owned by the selected operation. |
| `templates` | none | List 14 template IDs. |
| `org <action>` | `trust/import/validate/evaluate/audit/compliance` | Manage and enforce signed local organization policies. |
| `diagnostics <action>` | `health/bundle/metrics/traces/profile` | Inspect local telemetry or create a secret-safe bundle. |
| `supply-chain <action>` | `verify/scan/generate/artifacts` | Validate controls or generate SBOM, provenance, and checksums. |
| `skills <action>` | `list/trust/verify/install/status/remove` | Manage signed, policy-approved prompts and engineering skills. |
| `workflows <action>` | `validate/plan/run/resume/status` | Run deterministic resumable DAG workflows with consent checkpoints. |
| `index <action>` | `build/status/query/recommend` | Build, query, and produce read-only recommendations from a local metadata-only project index. |
| `semantic <action>` | `configure/status/plan/build/query` | Build and query an optional, consent-gated provider embedding index. |
| `copilot <action>` | `plan/run`, objective and provider flags | Produce read-only engineering plans from approved project metadata. |
| `capabilities` | none | Map capabilities to integrations. |
| `integrations <action> [name]` | `list/status/doctor/install/init/update/remove/validate/health` | Plan, initialize, validate, or update registry lifecycle. |
| `install [tool]` | consent flags | Official global tool installation plan/action. |
| `reference [name]` | consent flags | Reference repository clone plan/action. |
| `providers <action> [name]` | see provider actions below | Provider lifecycle, policy, auth, invocation, dashboard. |
| `credentials <action> [name]` | `--storage local|encrypted` | Secret initialization, masked setup, rotation, validation, backup, removal. |
| `mcp <action> [name]` | definition/host flags | Register, validate, activate, health-check, or remove. |
| `plugins <action> [source-or-id]` | trust and safety flags | Install/update declarative signed plugins and control activation. |
| `cloud list` | none | List supported cloud adapters. |
| `cloud <provider> <action>` | consent flags | Prepare, validate, verify, deploy, status, health, credentials, rollback. |
| `cloud render <action>` | Render configuration flags | Blueprint-specific lifecycle. |
| `docker <plan|validate|up|down>` | consent flags | Validate or execute Compose actions. |
| `dashboard` | `--port <port>` | Start authenticated loopback dashboard. |
| `config [key value]` | `export|import`, safety flags | Read/set safe config or transfer it. |
| `upgrade [rollback]` | safety flags | Upgrade managed workspace state or restore snapshot. |

Provider actions are `list`, `init`, `configure`, `status`, `doctor`, `validate`, `update`, `remove`, `models`, `project`, `mcp`, `invoke`, `test`, `verify`, `login`, `logout`, `limits`, and `dashboard`.

## Output and exit codes

Commands return JSON by default; verbose diagnostics go to the command result without exposing secrets. Exit `0` means success. Exit `1` means validation, policy, missing prerequisite, rejected consent, provider, or external command failure. Unknown commands print help.

## Error examples

- `Unsupported template` — choose an ID from `templates`.
- `Initialize the project` — run `init --dry-run`, then `init --apply`.
- `Missing ... API key` — run `credentials configure <provider> --apply`.
- `Existing file ... skipped` — expected additive-only behavior.
- `Explicit consent required` — review the plan and rerun with `--apply --yes`.

See [Getting started](../getting-started/index.md), [providers](../providers/reference.md), and [operations](../operations/runbooks.md).
