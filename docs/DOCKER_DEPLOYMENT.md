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

## Forgevena CLI container

The canonical CLI image uses Node.js 22 LTS, runs as the non-root `node` user, and starts in writable `/workspace`. The package continues to support Node.js 20 and 22 outside the container. `doctor`, `version`, and `help` are read-only and require no mounted state:

```powershell
docker build -f Dockerfile.cli -t forgevena:local .
docker run --rm forgevena:local version
docker run --rm forgevena:local doctor --structured
docker run --rm forgevena:local help
```

Mount a project at `/workspace`. Existing files remain untouched unless a modifying command is explicitly invoked with `--apply`:

```powershell
docker run --rm -v "${PWD}:/workspace" forgevena:local doctor --structured
```

The preferred entrypoint is `forgevena`; the `ai-workspace` executable remains packaged for 1.x compatibility.
