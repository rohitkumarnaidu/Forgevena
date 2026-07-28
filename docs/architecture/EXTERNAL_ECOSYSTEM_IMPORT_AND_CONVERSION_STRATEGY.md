# External Ecosystem Import and Conversion Strategy

> **Status:** Strategic architecture direction; documentation only.
>
> **Authority:** This document separates source acquisition, host projection, and semantic conversion. Runtime work requires an approved RFC, ADR, threat model, schemas, fixtures, and change-readiness evidence.

## 1. Boundaries

| Contract | Responsibility |
| --- | --- |
| `SourceAdapter` | Detect and acquire material from GitHub, registries, npm, PyPI, OpenSpec, external catalogs, archives, and future sources. |
| `HostAdapter` | Import from or export to Claude, Codex, Cursor, Gemini CLI, IDEs, agent hosts, and other execution environments. |
| `Converter` | Transform supported source semantics into canonical Forgevena capability definitions while producing explicit loss and permission-delta evidence. |

A source package is not automatically a Forgevena capability. Acquisition proves only that content was obtained; it does not prove safety, semantic compatibility, publisher identity, or permission suitability.

## 2. Governed Pipeline

```text
Detect -> Acquire -> Quarantine -> Inspect -> Normalize
-> Compatibility Analysis -> Convert or Manual Adaptation
-> Validate -> Sandbox Test -> Package -> Sign -> Install
```

Each stage is independently resumable and records source identity, digest, adapter and converter versions, policy decisions, findings, evidence, and the next permitted action. Network acquisition requires explicit consent. Installation remains a separate preview-first operation.

## 3. Outcomes

| Outcome | Meaning |
| --- | --- |
| `native` | The canonical capability already uses a supported Forgevena contract. |
| `exact` | Conversion preserves declared semantics without known loss. |
| `translated` | A supported representation change preserves required behavior with documented differences. |
| `degraded` | A usable subset is available with acknowledged limitations. |
| `manual-adaptation` | Safe automated conversion is unavailable, but guided remediation is possible. |
| `unsupported` | Required semantics, permissions, provenance, or safety controls cannot be represented; processing stops. |

No stage silently drops commands, hooks, permissions, memory behavior, external effects, or lifecycle code.

## 4. Evidence and Safety

Every conversion report includes:

- source, publisher, version, digest, license, and provenance;
- detected type and confidence with the evidence used;
- dependency graph, conflicts, and external source requirements;
- semantic loss and permission-delta reports;
- data classes, secret references, network access, and external effects;
- malware, archive, path traversal, lifecycle-script, and supply-chain findings;
- sandbox results, unsupported behavior, required manual changes, and rollback limits;
- target capability identities, package digest, signatures, and compatibility expiry.

Quarantined content cannot execute. Executable conversion helpers run only in an approved sandbox with default-denied host capabilities, bounded resources, policy approval, and explicit consent.

## 5. Resolution and Recovery

Conversion creates a new immutable package release; it never rewrites the source artifact. Re-running with the same inputs, converter version, policy, and canonical serialization must produce the same semantic result or explain the variance.

Failed conversion retains quarantine and evidence according to policy but creates no installation. Failed installation preserves the previous package, configuration, activation, and lockfile. Removal affects only unchanged managed assets.

## 6. Contract Direction

Candidate contracts are:

- `source-adapter/v1`
- `conversion-report/v1`
- `workspace-scope/v1`
- `recommendation-evidence/v1`

These names reserve architecture direction only. They are not implementation authorization or compatibility promises.

## 7. Acceptance Direction

- Unsupported input fails visibly and cannot be installed.
- Conversion cannot broaden source or policy permissions.
- Loss, permission, dependency, provenance, and rollback evidence is complete.
- Archive bombs, traversal, malicious scripts, ambiguous identity, and dependency confusion fail safely.
- Offline conversion works from a complete signed acquisition bundle.
- Host and source adapters have dated fixtures, expiry, ownership, and published limitations.
