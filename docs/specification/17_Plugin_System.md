# Plugin System

Phase 5 supports versioned declarative plugins. A plugin manifest declares compatibility, permissions, contributions, and integrity metadata. Installed manifests are copied into a project audit cache and locked with SHA-256.

Plugins remain disabled by default and never receive secrets. Executable plugin code is rejected until a future sandbox design is approved through architecture governance.

Phase 6 remote distribution requires an Ed25519 signature from a publisher public key explicitly added to the project trust store. Private signing keys are never accepted or stored. Local manifests may remain unsigned for development, but they remain disabled by default and their unsigned status is reported.
