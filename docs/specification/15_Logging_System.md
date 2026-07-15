# Logging System

Use structured JSONL events with timestamp, command, outcome, and non-sensitive metadata. Separate operational logs by `doctor`, `install`, `init`, `update`, `rollback`, and `error` event types.

Logs must redact secrets and support configurable retention.
