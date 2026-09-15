# Forgevena Command Center

This is the Next.js App Router experience for the local Forgevena dashboard. It is a presentation layer over the existing authenticated loopback APIs; it does not create a second provider, credential, workflow, policy, or registry runtime.

## Local development

1. Start the governed API on a fixed loopback port:

   ```powershell
   forgevena dashboard --port 4317
   ```

2. In this directory, install dependencies and configure the API bridge:

   ```powershell
   npm install
   $env:FORGEVENA_DASHBOARD_URL="http://127.0.0.1:4317"
   npm run dev
   ```

3. Open `http://localhost:3000`. Paste the dashboard URL printed by Forgevena into **Settings**. The session token is held in browser session storage only and is never sent to the Next.js server except as an authenticated request header.

## Pages

- **Overview:** workspace health, readiness, current activity, and safe next actions.
- **Workspace:** ownership, scope precedence, privacy, and local workspace boundaries.
- **Agents:** host adapters, read-only Engineering Copilot planning, authority and capability boundaries.
- **Runs:** bounded workflow run state and resumability; execution remains on the governed CLI path.
- **Providers:** credential slots, models, policy, compatibility evidence, and consented health tests.
- **Capabilities:** capability families, maturity, trust, and lifecycle ownership.
- **Integrations:** MCP, plugins, Render, cloud adapters, and ecosystem health.
- **Updates:** preview-first update channels, migration, rollback, and evidence gates.
- **Evidence:** dated compatibility and verification records without secret or source content.
- **Releases:** release readiness, artifact, documentation, migration, and approval gates.
- **Audit history:** normalized local activity and retention boundaries.
- **Security:** trust boundaries, privacy posture, audit metadata, and release evidence.
- **Settings:** API connection, theme, session reset, and operator preferences.

## Safety boundary

The app never renders secret values, source contents, provider responses, or workflow inputs. Mutating actions remain explicit and consent-gated. The Next.js proxy only forwards the allowlisted dashboard routes required by the UI.

## Validation

Run `npm run build` before publishing the console. The parent repository still owns the CLI, loopback server, documentation, governance, and release gates.
