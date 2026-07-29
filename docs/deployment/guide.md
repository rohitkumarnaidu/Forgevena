# Deployment Guide

Local development supports Windows, WSL/Linux, and macOS. Use Node.js 20.19+, Git, and optional Docker.

## Containers

```powershell
ai-workspace docker validate
ai-workspace docker plan
ai-workspace docker up --apply --yes
ai-workspace docker down --apply --yes
```

Stack templates use non-root runtime users where practical, production Compose restart policies, health checks, `.dockerignore`, and GitHub Actions validation.

## Cloud preparation

Supported adapters include Render, Vercel, Railway, Fly.io, Azure, AWS, Google Cloud, and DigitalOcean. The platform generates or validates declarative configuration and returns an execution plan. It does not deploy without explicit approval and credentials.

```powershell
ai-workspace cloud list
ai-workspace cloud vercel prepare --dry-run
ai-workspace cloud vercel validate
ai-workspace cloud vercel deploy --dry-run
ai-workspace cloud render generate --apply
ai-workspace cloud render validate
ai-workspace cloud render deploy --dry-run
```

Review billing, region, data residency, secret configuration, and rollback limits before any remote action. See [Cloud platforms](../CLOUD_PLATFORMS.md).

## Documentation deployment

GitHub Pages builds install both locked dependency sets before validating or rendering the site:

1. `npm ci --ignore-scripts` provides the Node.js modules required by documentation and governance validators.
2. `pip install -r website/requirements.txt` provides the pinned MkDocs toolchain.
3. Documentation validation and the strict MkDocs build run before the Pages artifact is uploaded.

The Pages workflow is triggered by documentation, website, validator, workflow, and Node.js lockfile changes. A failed build never reaches the deployment job; rollback is performed by reverting the responsible repository change and allowing the previous Pages artifact to remain active.
