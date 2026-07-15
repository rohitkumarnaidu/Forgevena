const templates = ["react", "nextjs", "fastapi", "express", "flutter", "python", "ai-agent", "rag", "full-stack-ai", "microservices", "library", "cli", "blank", "enterprise"];
const providers = ["claude", "codex", "cursor", "gemini", "openai", "openrouter", "windsurf"];

const file = (path, contents) => ({ path, contents: `${contents.trim()}\n` });
const nodeCi = (buildCommand) => file(".github/workflows/ci.yml", `name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run test --if-present
      - run: ${buildCommand}
      - run: npm audit --omit=dev --audit-level=high
`);
const pythonCi = (buildCommand) => file(".github/workflows/ci.yml", `name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install --upgrade pip
      - run: pip install . pytest pip-audit
      - run: python -m pytest
      - run: ${buildCommand}
      - run: pip-audit
`);
const securityAssets = () => [
  file(".github/dependabot.yml", `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"`),
  file("security/dependency-policy.md", "# Dependency Policy\n\nCommit reviewed lockfiles, scan dependencies in CI, and remediate critical findings before release."),
];

export function listTemplates() { return templates; }
export function validateTemplate(name = "enterprise") { if (!templates.includes(name)) throw new Error(`Unsupported template: ${name}`); return name; }
export function validateProvider(name) { if (name && !providers.includes(name)) throw new Error(`Unsupported provider: ${name}`); return name ?? null; }

export function templateAssets(template) {
  const assets = {
    react: [
      file("package.json", `{"private":true,"scripts":{"dev":"vite","test":"vitest run","build":"vite build"},"dependencies":{"react":"^19.0.0","react-dom":"^19.0.0"},"devDependencies":{"@vitejs/plugin-react":"^4.3.4","vite":"^6.0.0","vitest":"^3.0.0"}}`),
      file("index.html", "<div id=\"root\"></div><script type=\"module\" src=\"/src/main.jsx\"></script>"),
      file("src/main.jsx", "import { createRoot } from 'react-dom/client';\n\ncreateRoot(document.getElementById('root')).render(<main>React project</main>);"),
      file("Dockerfile", `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80`),
      file("docker-compose.yml", "services:\n  app:\n    build: .\n    ports:\n      - \"8080:80\""),
      nodeCi("npm run build"),
    ],
    nextjs: [
      file("package.json", `{"private":true,"scripts":{"dev":"next dev","test":"node --test","build":"next build","start":"next start"},"dependencies":{"next":"^15.0.0","react":"^19.0.0","react-dom":"^19.0.0"}}`),
      file("next.config.mjs", "export default { output: 'standalone' };"),
      file("app/layout.js", "export default function RootLayout({ children }) { return <html><body>{children}</body></html>; }"),
      file("app/page.js", "export default function Home() { return <main>Next.js project</main>; }"),
      file("public/.gitkeep", ""),
      file("Dockerfile", `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]`),
      file("docker-compose.yml", "services:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\""),
      nodeCi("npm run build"),
    ],
    fastapi: [
      file("pyproject.toml", `[project]
name = "project"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["fastapi>=0.115", "uvicorn[standard]>=0.30"]

[tool.setuptools.packages.find]
where = ["src"]`),
      file("src/app/__init__.py", ""),
      file("src/app/main.py", `from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}`),
      file("tests/unit/test_health.py", "from app.main import health\n\ndef test_health():\n    assert health() == {'status': 'ok'}"),
      file("Dockerfile", `FROM python:3.12-slim
WORKDIR /app
RUN adduser --disabled-password --gecos \"\" appuser
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`),
      file("docker-compose.yml", "services:\n  app:\n    build: .\n    ports:\n      - \"8000:8000\""),
      pythonCi("python -m compileall src"),
    ],
    express: [
      file("package.json", `{"private":true,"scripts":{"start":"node src/server.js","test":"node --test"},"dependencies":{"express":"^5.0.0"}}`),
      file("src/server.js", `import express from "express";

const app = express();
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.listen(process.env.PORT || 3000);`),
      file("Dockerfile", `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
USER node
EXPOSE 3000
CMD ["npm", "start"]`),
      file("docker-compose.yml", "services:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\""),
      nodeCi("npm run test --if-present"),
    ],
    python: [
      file("pyproject.toml", `[project]
name = "project"
version = "0.1.0"
requires-python = ">=3.11"

[tool.setuptools.packages.find]
where = ["src"]`),
      file("src/app/__init__.py", ""),
      file("src/app/main.py", "def main() -> str:\n    return 'Python project'"),
      file("tests/unit/test_main.py", "from app.main import main\n\ndef test_main():\n    assert main() == 'Python project'"),
      file("Dockerfile", `FROM python:3.12-slim
WORKDIR /app
RUN adduser --disabled-password --gecos \"\" appuser
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .
USER appuser
CMD ["python", "-c", "from app.main import main; print(main())"]`),
      file("docker-compose.yml", "services:\n  app:\n    build: ."),
      pythonCi("python -m compileall src"),
    ],
    flutter: [file("pubspec.yaml", "name: project\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'")],
    "ai-agent": [file("pyproject.toml", "[project]\nname = \"ai-agent\"\nrequires-python = \">=3.11\"")],
    rag: [file("pyproject.toml", "[project]\nname = \"rag-app\"\nrequires-python = \">=3.11\"")],
    "full-stack-ai": [file("README.md", "# Full Stack AI Project\n\nBackend and frontend boundaries are documented before implementation.")],
    microservices: [file("docs/architecture/services.md", "# Service Boundaries\n\nDocument service ownership, APIs, data, and operational contracts.")],
    library: [file("src/index.js", "export {};" )],
    cli: [file("src/cli.js", "#!/usr/bin/env node\nconsole.log('Configure CLI commands.');")],
    blank: [],
    enterprise: [file("docs/architecture/enterprise.md", "# Enterprise Architecture\n\nDocument domains, controls, and operational ownership.")],
  };
  return [...(assets[template] ?? []), ...securityAssets()];
}
