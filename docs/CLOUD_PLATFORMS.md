# Cloud Platform Integrations

The platform supports additive configuration, preflight, credential verification, status, and consent-gated deployment workflows for Render, Vercel, Railway, Fly.io, Azure, AWS, Google Cloud, and DigitalOcean.

```powershell
node .\bin\ai-workspace.js cloud list
node .\bin\ai-workspace.js cloud vercel prepare
node .\bin\ai-workspace.js cloud vercel prepare --apply
node .\bin\ai-workspace.js cloud vercel credentials --apply
node .\bin\ai-workspace.js cloud vercel validate
node .\bin\ai-workspace.js cloud vercel verify --apply --yes
node .\bin\ai-workspace.js cloud vercel deploy --apply --yes
node .\bin\ai-workspace.js cloud vercel status --apply --yes
node .\bin\ai-workspace.js cloud vercel health
node .\bin\ai-workspace.js cloud vercel rollback
```

Preparation creates an absent platform configuration and project guide. Existing files are skipped. No adapter deploys during preparation or deletes cloud resources. Every external execution defaults to a dry-run plan and requires `--apply --yes` after reviewing billing, repository access, regions, data residency, secrets, and rollback behavior.

Generated application names derive from the local project directory. Account-owned identifiers such as repository ownership, subscription/project selection, IAM roles, and service IDs remain user-supplied deployment inputs. Rollback is a non-destructive plan that identifies managed preparation files and directs the user to restore and redeploy a reviewed known-good revision. External resources are never deleted automatically.

Each adapter also exposes `verify`, `deploy`, and `status` execution plans through its official CLI. Preflight checks the generated artifact, credential reference, and CLI executable. Credentials are injected through the child-process environment and never returned or logged. Successful operations update the cloud registry with status and timestamps.

AWS deployment intentionally stops at the account-specific deployment boundary. Verification and status use the AWS CLI, but deployment requires the user to select an approved target such as App Runner, ECS, Lambda, or another service and provide its source, IAM, network, region, and billing configuration. The platform does not misrepresent a read-only AWS command as a deployment.
