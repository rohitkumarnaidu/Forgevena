# Documentation Platform Operations

## Pull requests

Documentation CI runs the source-backed validator, full platform tests, strict MkDocs build, search/404 assertions, Markdown lint, and internal/external link checks. Contributors preview locally with `mkdocs serve`.

## Main branch

An approved documentation change builds an immutable Pages artifact and deploys it through the protected `github-pages` environment. Concurrency prevents overlapping deployments while preserving in-progress publication.

## Version release

Run the normal release verification first. A maintainer may publish versioned documentation with Mike after the release tag is approved. `latest` is updated only for stable releases.

## Rollback

GitHub Pages retains prior deployments. Re-run the Pages workflow on the last known-good commit or use GitHub's deployment controls. For Mike, redeploy the previous documentation version/alias from the `gh-pages` branch. Never rewrite documentation history without review.

## Custom domain

Configure the domain in repository Pages settings, add the verified DNS records, enable HTTPS, and add a reviewed `CNAME` asset only after ownership is established.
