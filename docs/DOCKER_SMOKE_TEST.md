# Docker Smoke-Test Prerequisites

Use `docker compose config` to validate generated Compose syntax without starting containers. A real `docker build` or `ai-workspace docker up --apply` requires Docker Desktop or another compatible Docker daemon to be running.

The workspace does not start containers during automated tests. CI templates build images on GitHub-hosted Docker runners.
