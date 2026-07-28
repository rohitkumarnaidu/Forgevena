# Host Adapter and Portability Strategy

> **Status:** Provider- and host-neutral contract direction; documentation only.

## 1. Purpose

Host adapters translate the canonical Forgevena capability package into host-native representations without making any vendor format authoritative. Core capability semantics, permissions, evidence, and identity remain portable.

Host adapters do not acquire arbitrary external packages or decide whether they are valid capabilities. Source acquisition and semantic conversion are governed by the [External Ecosystem Import and Conversion Strategy](EXTERNAL_ECOSYSTEM_IMPORT_AND_CONVERSION_STRATEGY.md).

## 2. Contract

The future versioned `HostAdapter` contract provides:

- `probe`
- `capabilities`
- `import`
- `normalize`
- `validate`
- `planExport`
- `export`
- `planInstall`
- `verify`
- `health`
- `planRemove`

All mutating plans remain preview-first. Installation and removal preserve managed ownership, additive safety, policy evaluation, consent, and rollback.

## 3. Compatibility Outcomes

| Result | Meaning |
| --- | --- |
| `native` | The canonical primitive executes directly through the host's documented contract. |
| `exact` | Translation preserves declared semantics and evidence without known loss. |
| `translated` | Translation is supported with documented representation changes. |
| `degraded` | A usable subset is exported with explicit limitations and risk. |
| `unsupported` | Required semantics cannot be represented safely; the operation stops. |

Every import and export produces a machine-readable loss report. Unsupported primitives are never silently removed, permissions are never broadened, and a degraded export requires explicit acknowledgement.

## 4. Host Profiles

Initial research profiles cover Claude, Cursor, Codex, OpenCode, Antigravity, Hermes, Gemini CLI, Windsurf, Cline, Aider, VS Code and Copilot, JetBrains, desktop agents, cloud agents, and generic MCP or Agent Skills hosts.

Each profile records:

- host and adapter versions;
- supported primitives and lifecycle surfaces;
- permissions, secrets, data-flow, and runtime boundaries;
- import and export mappings;
- expected semantic losses;
- installation and removal behavior;
- fixtures, smoke evidence, verification date, expiry, and owner.

A profile is not described as supported until current fixtures and smoke evidence exist. Documentation without evidence may say `research target` only.

## 5. Negotiation and Selection

Capability negotiation compares package requirements with host primitives, policy, runtime, platform, and user scope. Resolution fails closed when a mandatory primitive, permission boundary, data-control requirement, or rollback guarantee is unavailable.

When multiple hosts are available, selection is explicit and explainable. Ranking cannot silently trade security, privacy, fidelity, cost, or local operation for convenience.

## 6. Portability Guarantees

- Canonical definitions remain exportable without a hosted account.
- Host-specific state is an adapter-owned projection, not the source of truth.
- Round-trip tests detect semantic drift.
- Import never grants permissions absent from the source or local policy.
- Removal deletes only unchanged adapter-managed assets.
- Offline and air-gapped export retains hashes, signatures, license, provenance, compatibility, and loss evidence.

The adapter foundation is planned for `v1.5`; canonical schemas and registry contracts mature in `v2.1`; publisher exporters mature in `v2.4`; broad host bridges mature in `v2.6`; certification belongs to `v2.7`.
