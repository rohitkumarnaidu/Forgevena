# ADR 0006: Local Provider Credential Entry

## Decision

The provider CLI may create an absent project `.env` file from an interactive masked prompt when the user explicitly runs `providers configure <provider> --apply`.

## Safeguards

The CLI never accepts a key as an argument, prints it, logs it, stores it in the registry, modifies an existing `.env`, or permits non-interactive key entry. Existing `.env` files are preserved and require manual user configuration.
