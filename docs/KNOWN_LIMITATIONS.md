# Known Limitations

- Live provider, MCP, plugin, and cloud validation requires user-owned credentials and network access.
- OS credential-store provisioning is host-specific; the project supports environment and encrypted local storage.
- Cloud blueprints are safe baselines, not substitutes for account-specific IAM, networking, billing, compliance, or data-residency design.
- AWS deployment requires an explicitly selected service architecture.
- Shell completion remains limited to the committed generated completion assets.
- Coverage instrumentation enforces the v1.3 minimums of 90% lines, 85% branches, and 90% functions. State and vault evidence is tracked separately in the v1.3 implementation report.
- External cloud resources are never deleted automatically.
- Standalone `v1.3.0` executables target x64. arm64 installations use npm until native arm64 release builders are certified.
