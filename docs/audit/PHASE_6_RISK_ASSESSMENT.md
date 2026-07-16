# Phase 6 Risk Assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| User deploys generic cloud baseline without account review | Medium | Dry-run, explicit consent, validation, known limitations, and no automatic deletion. |
| Registry JSON corruption is interpreted as missing in some readers | Medium | Backups, validation, additive behavior; atomic persistence/corruption diagnostics remain prioritized debt. |
| Third-party CLI/API behavior changes | Medium | Official command boundaries, preflight checks, timeouts, mocked tests, explicit compatibility limitation. |
| Secret reaches a structured log through a future caller | Low | Central recursive key-based redaction plus caller contracts and tests. |
| Dashboard token probing | Low | Loopback binding, random 256-bit token, origin check, no-store response, constant-time comparison. |
| Cross-platform executable differences | Medium | Windows/Linux/macOS metadata and CI design; account-backed external CLI testing remains operator-dependent. |
