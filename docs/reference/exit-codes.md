# Exit Codes

| Code | Meaning | Operator action |
|---:|---|---|
| `0` | Command completed successfully, including a successful preview or safe skip | Review structured result. |
| `1` | Invalid command/options, failed validation, missing prerequisite, denied consent, provider/external failure, or internal error | Read the error, correct the cause, rerun preview. |

Automation should parse JSON output and the process exit code together. A dry-run with planned changes is success (`0`), not drift failure.
