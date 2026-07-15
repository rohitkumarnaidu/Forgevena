# Configuration System

Configuration precedence is: CLI flags, project config, workspace config, built-in defaults. Configuration schemas are versioned and validated before use.

Secret-bearing fields are rejected; users receive a reference to environment variables or a secret manager instead.
