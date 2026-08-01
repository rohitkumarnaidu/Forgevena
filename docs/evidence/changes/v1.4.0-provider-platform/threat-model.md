# Threat Model — Production Provider Platform

## Assets and Boundaries

Restricted assets are credentials, authorization headers, prompts, responses, tool payloads, and structured-output data. External provider APIs and agent hosts are untrusted network or process boundaries.

## Principal Threats and Controls

- Secret or content leakage: secret references only, recursive redaction, allowlisted metadata, sanitized fixtures, and zero restricted-content retention.
- Retry or fallback duplication: explicit idempotency, one deadline, bounded attempts, committed-effect tracking, and policy-approved fallback.
- Provider drift or spoofed compatibility: checksummed dated evidence, expiry, fail-closed policy, and no inferred support.
- Budget exhaustion and denial of service: request, token, cost, time, concurrency, and output limits with cancellation.
- Migration corruption: StateEngine transaction, checksum validation, snapshot, recovery, and rollback.
- Tool escalation: capability negotiation, approved tool declarations, consent, and no retry after an external effect.

Residual external account, billing, provider availability, and provider-side retention risks remain user-owned and must be disclosed before consent.
