# Production Example Catalog

Every first-party template is generated and validated by the automated test suite. Create examples in disposable directories:

| Example | Command | Production baseline |
|---|---|---|
| React | `create ReactApp --template react --apply` | Vite, TypeScript, Vitest, Nginx, Compose, CI |
| Next.js | `create WebApp --template nextjs --apply` | App Router, standalone image, Compose, CI |
| FastAPI | `create Api --template fastapi --apply` | Health route, unit tests, non-root image, CI |
| Express | `create Service --template express --apply` | TypeScript, health route, multi-stage image, CI |
| Flutter | `create Mobile --template flutter --apply` | Widget test, web image, Compose, CI |
| AI Agent | `create Agent --template ai-agent --apply` | Python src layout, test, container, CI |
| RAG | `create Knowledge --template rag --apply` | FastAPI service baseline and health check |
| Microservices | `create Platform --template microservices --apply` | Gateway, service contract, Compose, CI |
| CLI extension | `create Tool --template cli --apply` | TypeScript executable, strict build, tests |
| Plugin | Use `examples/plugin/manifest.json` | Declarative permissions and validation |
| Enterprise | `create Product --template enterprise --apply` | Architecture-first documentation and ADR |

Always preview by replacing `--apply` with `--dry-run --verbose`. Generated dependencies are intentionally not installed by the bootstrap command.
