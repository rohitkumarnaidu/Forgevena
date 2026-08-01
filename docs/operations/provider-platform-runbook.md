# Provider Platform Runbook

## Scope

This runbook covers provider credential failures, outages, quota exhaustion, stale compatibility evidence, malformed streams, denied fallback, and registry migration recovery. Prompts, responses, credentials, and authorization headers must never be copied into incidents.

## Initial Triage

1. Run `forgevena providers status <provider> --structured`.
2. Run `forgevena credentials status <provider> --structured` without exposing the credential value.
3. Review authentication, discovery, invocation, rate-limit, and compatibility health independently.
4. Capture the operation ID, normalized error code, provider, model, timestamps, attempt count, and evidence ID only.

## Failure Procedures

- **Credential failure:** validate the credential reference, rotate through the credential command, and retest. Never pass a secret as a command argument.
- **Provider outage:** stop unsafe retries, preserve the original deadline, and use explicit fallback only when capability, privacy, region, and trust requirements match.
- **Quota exhaustion:** reduce approved budgets or wait for the provider reset. Do not bypass organization policy.
- **Stale evidence:** refresh credential-gated compatibility evidence. Policy requiring current evidence fails closed.
- **Malformed stream:** cancel the operation, retain normalized metadata, quarantine the fixture, and open a provider compatibility incident.
- **Fallback denial:** inspect idempotency, committed tool effects, required capabilities, privacy class, region, and evidence freshness.
- **Migration failure:** retain the failed operation ID, validate the automatic snapshot, and restore the prior registry snapshot. Existing provider files remain untouched.

## Recovery Validation

Run provider status, registry validation, a dry-run invocation, and the deterministic contract suite. Live verification remains credential- and consent-gated.
