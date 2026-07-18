# Recommended GitHub Repository Settings

## Identity

| Setting | Recommended value |
|---|---|
| Name | `forgevena` after redirect and release checks are approved |
| Description | Enterprise developer platform for governed project delivery, AI integrations, and release engineering. |
| Website | `https://rohitkumarnaidu.github.io/Forgevena/` until a custom domain is approved |
| Topics | `developer-platform`, `cli`, `ai`, `devops`, `bootstrap`, `mcp`, `release-engineering`, `nodejs`, `open-source`, `platform-engineering` |
| Default branch | `main` |
| Social preview | `docs/assets/forgevena-social-preview.png` |

## Merge policy

- Enable squash merge with pull-request title as the commit subject.
- Enable rebase merge for maintainer-controlled linear history.
- Disable merge commits unless a demonstrated release need exists.
- Automatically delete head branches after merge.
- Require conversations to be resolved.
- Enable merge queue when repository traffic makes serial rebasing expensive.

## Branch protection for `main`

- Require pull requests and at least one approval.
- Require CODEOWNERS review for owned paths.
- Dismiss stale approvals after new commits.
- Require CI, Documentation CI, Security, Dependency Review, and Package Validation.
- Require branches to be up to date or use merge queue.
- Require signed commits when contributor accessibility and bot support are confirmed.
- Block force pushes and deletions.
- Restrict bypass to emergency maintainers and log every bypass.

## Security settings

Enable private vulnerability reporting, Dependabot alerts and updates, secret scanning, push protection, CodeQL default setup or the repository workflow, dependency graph, and security advisories.

## Environments and secrets

Create the protected `npm-release` environment and require maintainer approval. Configure npm Trusted Publishing for user `rohitkumarnaidu`, repository `Forgevena`, workflow `release.yml`, environment `npm-release`, and the `npm publish` action. The signed-tag `Automated Release` workflow uses GitHub Actions OIDC and does not require `NPM_TOKEN`; npm retries must use the same workflow identity. Store only `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` for optional Docker Hub publication. Retain the protected environment as the approval boundary.

These settings require repository-owner access and are intentionally documented rather than changed automatically.
