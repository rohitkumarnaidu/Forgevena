# Docker-Only Deployment

Create a container-ready project, validate its assets, then inspect the operation before starting containers:

```powershell
node .\bin\ai-workspace.js create DemoApi --template fastapi --apply
Set-Location DemoApi
node ..\bin\ai-workspace.js docker validate
node ..\bin\ai-workspace.js docker plan
```

Start or stop the local production Compose profile only after reviewing the plan:

```powershell
node ..\bin\ai-workspace.js docker up --apply
node ..\bin\ai-workspace.js docker down --apply
```

`docker up` and `docker down` require an interactive confirmation, or `--apply --yes` in a non-interactive environment. The workspace does not upload images or deploy to a cloud provider.
