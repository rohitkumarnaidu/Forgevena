# System Architecture

The platform is a local CLI with five layers: command interface, detection, module planning, transactional application, and project registry/logging. External tools are adapters, never embedded dependencies.

```text
Developer -> CLI -> Detector -> Module/Tool Adapter -> Plan -> Apply Transaction -> Registry + Logs
```

This separation keeps project bootstrapping deterministic and lets integrations evolve independently.
