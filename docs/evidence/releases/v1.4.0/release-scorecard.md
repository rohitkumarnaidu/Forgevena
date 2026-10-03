# v1.4.0 Stable Release Scorecard

**Decision: HOLD.** This is a release-checkpoint assessment, not the earlier push-readiness scorecard. No stable tag or publication is authorized.

**Outstanding mandatory blockers: 5.** Percentages are intentionally unscored until release evidence is complete; no score is inferred from the earlier push checkpoint.

| Gate | Required | Current evidence | Decision |
| --- | ---: | --- | --- |
| Critical controls | 100% | Release checkpoint has not been independently scored | HOLD |
| Important controls | 95% | Release checkpoint has not been independently scored | HOLD |
| Standard controls | 90% | Release checkpoint has not been independently scored | HOLD |
| Mandatory blockers | 0 | Three hosted live provider smoke records are absent; local Ollama inference previously timed out; exact RC3 lifecycle matrix is not run; owner release approval is absent; stable package-version promotion is not merged | HOLD |
| Exact candidate | Published `v1.4.0-rc.3` | Exact-artifact rehearsal pending on Windows/Linux/macOS × Node 20/22 | HOLD |
| Release approval | Explicit owner approval and normal review record | Not granted | HOLD |

The prior provider-platform scorecard is a **push** checkpoint and cannot be substituted for this release scorecard. Deterministic offline provider fixtures are not live compatibility evidence. The current machine-readable blockers and required evidence are in [stable-release-readiness.json](stable-release-readiness.json).

## Closure Evidence

Replace this HOLD assessment only after the independent release review scores every applicable domain, confirms all module thresholds, records the successful pre-tag workflow run and sanitized evidence, and records explicit owner approval. Never invent test results or use the push score as release approval.
