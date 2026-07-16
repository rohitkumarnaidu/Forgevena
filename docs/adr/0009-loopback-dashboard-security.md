# ADR 0009: Loopback Dashboard Security

The settings dashboard binds to `127.0.0.1` on an ephemeral port and uses a random in-memory session token. It rejects unauthorized and cross-origin API requests, disables caching and framing, limits request bodies, and never displays credential values.
