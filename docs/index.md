# Forgevena Documentation

Version: 1.0.0

**Governed engineering from idea to production.**

This portal is the canonical entry point for installing, operating, extending, and maintaining Forgevena. Existing historical, phase, release, and audit records remain available at the root of `docs/`.

## Start here

- [Getting started](getting-started/index.md)
- [Architecture](architecture/overview.md)
- [CLI reference](cli/reference.md)
- [Configuration reference](configuration/reference.md)
- [Security guide](security/guide.md)
- [Troubleshooting](troubleshooting/index.md)
- [Documentation website](website/OPERATIONS.md)
- [Public brand discovery](branding/BRAND_DISCOVERY.md)

## Platform domains

| Domain | Documentation |
|---|---|
| Modules and capabilities | [Modules](modules/reference.md), [capabilities](capabilities/reference.md) |
| Project generation | [Templates](templates/reference.md), [bootstrap](bootstrap/guide.md) |
| AI services | [Providers](providers/reference.md), [credentials](security/guide.md#credentials) |
| External tools | [Integrations](integrations/reference.md), [MCP and plugins](plugins/guide.md) |
| State | [Registry and managed assets](registry/reference.md), [configuration](configuration/reference.md) |
| Delivery | [Deployment](deployment/guide.md), [operations](operations/runbooks.md) |
| Engineering | [Developer guide](developer/index.md), [testing](testing/guide.md), [maintainers](maintainer/index.md) |

## Architecture map

```mermaid
flowchart LR
  User --> CLI
  CLI --> Project[Project and Bootstrap]
  CLI --> Integration[Integration Manager]
  CLI --> Provider[Provider Runtime]
  CLI --> Operations[Cloud, Docker, Dashboard]
  Project --> Registry
  Project --> Templates
  Integration --> Registry
  Provider --> Credentials
  Provider --> Policy[Provider Policy]
  Operations --> Registry
```

## Documentation conventions

Commands use `forgevena`; the legacy `ai-workspace` alias remains supported throughout 1.x. When running from source, substitute `node ./bin/forgevena.js`. Modifying commands preview by default. `--apply` enables local writes, and external actions additionally require `--yes` or interactive approval. Existing files are skipped.

See [Documentation coverage](DOCUMENTATION_COVERAGE.md) for the audited source-to-document matrix.
