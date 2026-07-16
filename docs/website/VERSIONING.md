# Documentation Versioning

- `latest` points to the newest stable major/minor documentation.
- Version labels use `major.minor` (for example, `1.0`).
- Patch releases update the corresponding major/minor site unless they change documented behavior.
- `main` documentation is validated on every change but is published as stable only through the release workflow.
- Removed or renamed pages require redirects or migration notes before publication.

Version deployment uses Mike and the `gh-pages` branch. GitHub Pages deployment also supports the immutable build artifact generated from an approved commit.

The current Pages artifact includes `versions.json`, so the selector is functional before the first historical version is published. Release automation must append stable versions without removing existing entries.
