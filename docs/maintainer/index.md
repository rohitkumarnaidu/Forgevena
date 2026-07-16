# Maintainer Guide

The project follows semantic versioning, protected review, conventional commits, reproducible npm archives, cross-platform CI, and documented security response.

## Release checklist

1. Reconcile roadmap, changelog, schemas, and compatibility matrix.
2. Run `npm test`, `npm audit --omit=dev`, `npm run benchmark`, and `npm run release:verify`.
3. Generate and verify distribution assets and checksum.
4. Verify archive installation and Docker CLI smoke test.
5. Confirm hosted Windows/Linux/macOS CI.
6. Tag only the reviewed commit; publish with authorized npm/GitHub credentials.
7. Publish release notes and retain rollback evidence.

Hotfixes require the same safety and regression gates. Security reports follow [Security response](../SECURITY_RESPONSE.md). Detailed governance is in [Maintainer guide](../MAINTAINER_GUIDE.md), [Release processes](../RELEASE_PROCESSES.md), and [LTS policy](../LTS_POLICY.md).
