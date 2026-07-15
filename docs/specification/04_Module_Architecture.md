# Module Architecture

Each module owns a small set of additive templates and declares its dependencies, detection rules, migrations, and rollback scope. Modules must be idempotent and cannot directly mutate application code.

Initial modules: bootstrap, OpenSpec, design, documentation, AI context, GitHub, testing, Docker, monitoring, security, and memory.
