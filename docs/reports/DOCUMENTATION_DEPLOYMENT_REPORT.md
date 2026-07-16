# Documentation Deployment Report

The documentation platform has three delivery stages:

1. `docs.yml` validates and builds a preview artifact.
2. `docs-deploy.yml` creates an on-demand/reusable site artifact without publishing.
3. `pages.yml` publishes an approved main-branch build to GitHub Pages.

This separation supports review, artifact inspection, protected deployment, and rollback without coupling documentation publication to npm or binary releases.
