# API Reference

The supported public API is the `ai-workspace` CLI described in `CLI.md`. Internal JavaScript modules are implementation details and do not carry semantic-versioning guarantees. Machine-readable output is JSON. Commands default to preview; local writes require `--apply`; external actions require explicit consent. Exit code `0` indicates success and non-zero indicates validation, authorization, execution, or configuration failure.
