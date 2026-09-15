# Provider Platform Runbook

## Scope

This runbook covers provider credential failures, outages, quota exhaustion, stale compatibility evidence, malformed streams, denied fallback, and registry migration recovery. Prompts, responses, credentials, and authorization headers must never be copied into incidents.

## Initial Triage

1. Run `forgevena providers status <provider> --structured`.
2. Run `forgevena credentials status <provider> --structured` without exposing the credential value.
3. Review authentication, discovery, invocation, rate-limit, and compatibility health independently.
4. Capture the operation ID, normalized error code, provider, model, timestamps, attempt count, and evidence ID only.

## Local Provider Console

Start the loopback-only console with `forgevena dashboard` and open the printed `127.0.0.1` URL in the same browser session. The URL fragment carries a one-process session token and is removed from the address bar after load. The console shows credential availability, declared provider capabilities, compatibility-evidence freshness, and policy mode; it never reads or displays a stored key.

- Use the sidebar to move between live overview, provider, integration, and evidence sections. Use the theme control to select light or dark mode; that preference remains only in this browser's local storage.
- Use **Key slots** to add a masked provider key, select the active slot, rotate a managed key, or quarantine a retired key. The input is cleared after submission and no saved value is displayed. A quarantined slot may be recovered for 30 days.
- Use **Save model** to persist a reviewed model identifier without invoking a provider. Ollama choices come from existing local status discovery; hosted model IDs are validated before the profile is updated.
- Use **Save policy** to select `guarded`, `budgeted`, or intentionally chosen `unrestricted` development mode.
- Use **Run consented health test** only after reviewing the browser confirmation. It sends the fixed text `Reply only with OK.` to the selected provider and may consume account quota. The dashboard retains at most 20 metadata-only test records; retain the operation ID and normalized metadata, never response content.
- Treat a stale, missing, or failed compatibility state as a health signal, not as a credential prompt. Refresh provider evidence through the approved provider lifecycle rather than weakening policy.

The console is a local command center, not an autonomous control plane. The **Agent command center** inventories host adapters and the read-only Engineering Copilot, while **Runs and workflows** shows bounded run metadata and resumability. Copilot planning uses approved project metadata only; it does not include source contents and does not modify files. Workflow execution remains on the governed CLI path so operators review the plan, policy, consent checkpoints, and `--apply` boundary before any mutation. MCP activation, plugin execution, deployment, billing, and external provider transmission retain their separate preview, policy, and consent gates.

### Agent and workflow operations

- Use the Agent view to confirm whether a host adapter is available, host-managed, and compatibility-only. Availability is not a safety or certification claim.
- Use the Engineering Copilot only for read-only plans and recommendations. A missing project index is shown as `needs-index`; build it through the CLI after reviewing its preview.
- Use Runs to inspect workflow status, node progress, and resumability. The dashboard deliberately does not launch arbitrary workflow files or approve nodes.
- Keep human promotion authority at the CLI and policy boundaries. No dashboard card, agent host, workflow, or recommendation may approve mutation, credential use, deployment, publication, billing, or release.
- The dashboard API exposes only normalized metadata. It does not return provider responses, credentials, source contents, workflow inputs, or audit payloads containing restricted data.

### Next.js Command Center

The optional `dashboard-next/` App Router application is the high-level desktop console over the same loopback API. It provides Overview, Agents, Runs, Providers, Capabilities, Integrations, Security, and Settings routes. It is not a second runtime or control plane: Core remains authoritative for policy, credentials, workflow execution, rollback, audit, and consent.

Start the API on a fixed local port, then run the console from `dashboard-next/`:

```powershell
forgevena dashboard --port 4317
$env:FORGEVENA_DASHBOARD_URL="http://127.0.0.1:4317"
npm install
npm run dev
```

Paste the printed loopback URL into **Settings**. The Next bridge forwards only the allowlisted normalized API routes and holds the session token in browser session storage. It never stores or renders credential values, provider responses, source contents, or workflow inputs. Run `npm run build` in `dashboard-next/` before publishing a console build.

## Failure Procedures

- **Credential failure:** inspect `forgevena credentials keys <provider>`, validate the active slot, rotate through the credential command, and retest. Never pass a secret as a command argument. If the active key must be quarantined, explicitly activate a replacement slot first or provide `--next-key-id`.
- **Provider outage:** stop unsafe retries, preserve the original deadline, and use explicit fallback only when capability, privacy, region, and trust requirements match.
- **Quota exhaustion:** reduce approved budgets or wait for the provider reset. Do not bypass organization policy.
- **Stale evidence:** refresh credential-gated compatibility evidence. Policy requiring current evidence fails closed.
- **Malformed stream:** cancel the operation, retain normalized metadata, quarantine the fixture, and open a provider compatibility incident.
- **Fallback denial:** inspect idempotency, committed tool effects, required capabilities, privacy class, region, and evidence freshness.
- **Migration failure:** retain the failed operation ID, validate the automatic snapshot, and restore the prior registry snapshot. Existing provider files remain untouched.

## Recovery Validation

Run provider status, registry validation, a dry-run invocation, and the deterministic contract suite. Live verification remains credential- and consent-gated.
