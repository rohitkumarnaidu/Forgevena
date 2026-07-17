# Template Reference

| Template | Baseline | Included delivery assets |
|---|---|---|
| `react` | Vite + React + TypeScript | tests, Nginx image, Compose, CI, dependency policy |
| `nextjs` | App Router + TypeScript | standalone image, Compose, CI, security assets |
| `fastapi` | Python + FastAPI | health route, tests, non-root image, CI |
| `express` | Express + TypeScript | health route, tests, multi-stage image, CI |
| `flutter` | Flutter web | widget test, image, Compose, CI |
| `python` | Python package | src layout, unit test, image, CI |
| `ai-agent` | Python agent package | agent entry, tests, image, CI |
| `rag` | FastAPI RAG service | health route, tests, image, CI |
| `full-stack-ai` | Next.js + FastAPI | frontend/backend images, Compose, CI |
| `microservices` | Service workspace | gateway, catalog contract, Compose, CI |
| `library` | TypeScript library | strict build, test and CI |
| `cli` | TypeScript CLI | executable starter, test and CI |
| `blank` | Governance only | no stack-specific source |
| `enterprise` | Architecture-first | enterprise architecture and template ADR |

Templates own only assets they generate. Existing paths are skipped. Preview with `create Name --template <id> --dry-run --verbose` and validate after apply.
