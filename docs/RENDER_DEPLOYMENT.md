# Render Deployment

Render deployment is Git-backed. The project must have an `origin` remote pushed to GitHub, GitLab, or Bitbucket before a Blueprint can be applied.

```powershell
node .\bin\ai-workspace.js cloud render generate
node .\bin\ai-workspace.js cloud render generate --apply
node .\bin\ai-workspace.js cloud render validate
node .\bin\ai-workspace.js cloud render plan
```

Generated services default to the free plan. Secrets use `sync: false`; users fill them in through Render or another approved secret workflow.

For an existing Render service, register non-secret service identifiers and deploy explicitly:

```powershell
node .\bin\ai-workspace.js cloud render credentials --apply
node .\bin\ai-workspace.js cloud render configure --service-ids srv_123 --workspace-id tea_123 --apply
node .\bin\ai-workspace.js cloud render deploy --apply
node .\bin\ai-workspace.js cloud render status --apply
node .\bin\ai-workspace.js cloud render rollback
```

The credential command prompts locally with masked input and stores the development token in `.ai-workspace/local-secrets/render.env`. Production credentials belong in an approved secret manager as `RENDER_API_KEY`.

The workspace never pushes Git commits, creates cloud secrets, deletes cloud resources, or silently rolls back. New Blueprint resources are created through the generated Render Dashboard deeplink after the user reviews billing and repository access. Programmatic deployment targets only service IDs explicitly registered by the user.
