const templates = ["react", "nextjs", "fastapi", "express", "flutter", "python", "ai-agent", "rag", "full-stack-ai", "microservices", "library", "cli", "blank", "enterprise"];
const providers = ["claude", "codex", "cursor", "gemini", "openai", "openrouter", "windsurf"];
const file = (path, contents) => ({ path, contents: `${contents.trim()}\n` });

const nodeCi = (directory = ".") => file(".github/workflows/ci.yml", `name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${directory}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm test --if-present
      - run: npm run build --if-present
      - run: npm audit --omit=dev --audit-level=high`);
const pythonCi = (directory = ".") => file(".github/workflows/ci.yml", `name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${directory}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install --upgrade pip
      - run: pip install . pytest pip-audit
      - run: python -m pytest
      - run: python -m compileall src
      - run: pip-audit`);
const flutterCi = file(".github/workflows/ci.yml", `name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
      - run: flutter build web`);
const dependencyPolicy = file("security/dependency-policy.md", "# Dependency Policy\n\nCommit reviewed lockfiles, scan dependencies in CI, and remediate critical findings before release.");
const dependabot = (ecosystems) => file(".github/dependabot.yml", `version: 2
updates:
${ecosystems.map((ecosystem) => `  - package-ecosystem: "${ecosystem}"\n    directory: "/"\n    schedule:\n      interval: "weekly"`).join("\n")}`);
const nodeSecurity = () => [dependencyPolicy, dependabot(["npm"])];
const pythonSecurity = () => [dependencyPolicy, dependabot(["pip"])];
const flutterSecurity = () => [dependencyPolicy, dependabot(["pub"])];
const mixedSecurity = () => [dependencyPolicy, dependabot(["npm", "pip"])];
const compose = (services) => file("docker-compose.yml", `services:
${services.map((service) => `  ${service.name}:\n    build: ${service.build ?? "."}${service.ports ? `\n    ports:\n      - "${service.ports}"` : ""}`).join("\n")}`);
const tsConfig = file("tsconfig.json", `{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","strict":true,"outDir":"dist","skipLibCheck":true},"include":["src"]}`);

export function listTemplates() { return templates; }
export function validateTemplate(name = "enterprise") { if (!templates.includes(name)) throw new Error(`Unsupported template: ${name}`); return name; }
export function validateProvider(name) { if (name && !providers.includes(name)) throw new Error(`Unsupported provider: ${name}`); return name ?? null; }
export function templateRequiredAssets(template) { return templateAssets(template).map((asset) => asset.path); }

export function templateAssets(template) {
  const assets = {
    react: [
      file("package.json", `{"private":true,"scripts":{"dev":"vite","test":"vitest run","build":"tsc --noEmit && vite build"},"dependencies":{"react":"^19.0.0","react-dom":"^19.0.0"},"devDependencies":{"@types/react":"^19.0.0","@types/react-dom":"^19.0.0","@vitejs/plugin-react":"^4.3.4","typescript":"^5.7.0","vite":"^6.0.0","vitest":"^3.0.0"}}`),
      file("index.html", "<div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script>"),
      file("src/main.tsx", "import { createRoot } from 'react-dom/client';\nimport { App } from './App.js';\n\ncreateRoot(document.getElementById('root')!).render(<App />);"),
      file("src/App.tsx", "export function App() { return <main>React project</main>; }"),
      file("vite.config.ts", "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });"),
      tsConfig,
      file("Dockerfile", "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\n\nFROM nginx:1.27-alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80"),
      compose([{ name: "app", ports: "8080:80" }]), nodeCi(), ...nodeSecurity(),
    ],
    nextjs: [
      file("package.json", `{"private":true,"scripts":{"dev":"next dev","test":"node --test","build":"next build","start":"next start"},"dependencies":{"next":"^15.0.0","react":"^19.0.0","react-dom":"^19.0.0"},"devDependencies":{"typescript":"^5.7.0","@types/node":"^22.0.0","@types/react":"^19.0.0","@types/react-dom":"^19.0.0"}}`),
      file("next.config.mjs", "export default { output: 'standalone' };"),
      file("app/layout.tsx", "export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html><body>{children}</body></html>; }"),
      file("app/page.tsx", "export default function Home() { return <main>Next.js project</main>; }"),
      file("public/.gitkeep", ""),
      file("tsconfig.json", `{"compilerOptions":{"target":"ES2022","lib":["dom","dom.iterable","esnext"],"strict":true,"noEmit":true,"module":"esnext","moduleResolution":"bundler","jsx":"preserve"},"include":["next-env.d.ts","**/*.ts","**/*.tsx"]}`),
      file("Dockerfile", "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=build /app/public ./public\nCOPY --from=build /app/.next/standalone ./\nCOPY --from=build /app/.next/static ./.next/static\nUSER node\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]"),
      compose([{ name: "app", ports: "3000:3000" }]), nodeCi(), ...nodeSecurity(),
    ],
    fastapi: pythonApiAssets("app", "FastAPI project", "fastapi"),
    express: [
      file("package.json", `{"private":true,"type":"module","scripts":{"dev":"tsx watch src/server.ts","test":"node --test","build":"tsc","start":"node dist/server.js"},"dependencies":{"express":"^5.0.0"},"devDependencies":{"@types/express":"^5.0.0","@types/node":"^22.0.0","tsx":"^4.19.0","typescript":"^5.7.0"}}`),
      file("src/server.ts", "import express from 'express';\n\nconst app = express();\napp.get('/health', (_request, response) => response.json({ status: 'ok' }));\napp.listen(process.env.PORT ?? 3000);"),
      tsConfig,
      file("Dockerfile", "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY src ./src\nCOPY tsconfig.json ./\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm install --omit=dev\nCOPY --from=build /app/dist ./dist\nUSER node\nEXPOSE 3000\nCMD [\"npm\", \"start\"]"),
      compose([{ name: "app", ports: "3000:3000" }]), nodeCi(), ...nodeSecurity(),
    ],
    flutter: [
      file("pubspec.yaml", "name: project\ndescription: Enterprise Flutter starter\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\ndev_dependencies:\n  flutter_test:\n    sdk: flutter"),
      file("lib/main.dart", "import 'package:flutter/material.dart';\n\nvoid main() => runApp(const App());\nclass App extends StatelessWidget { const App({super.key}); @override Widget build(BuildContext context) => const MaterialApp(home: Scaffold(body: Center(child: Text('Flutter project')))); }"),
      file("test/widget_test.dart", "import 'package:flutter_test/flutter_test.dart';\n\nvoid main() { test('starter test', () => expect(true, isTrue)); }"),
      file("Dockerfile", "FROM ghcr.io/cirruslabs/flutter:stable AS build\nWORKDIR /app\nCOPY . .\nRUN flutter build web\n\nFROM nginx:1.27-alpine\nCOPY --from=build /app/build/web /usr/share/nginx/html\nEXPOSE 80"),
      compose([{ name: "app", ports: "8080:80" }]), flutterCi, ...flutterSecurity(),
    ],
    python: pythonPackageAssets("app", "Python project"),
    "ai-agent": pythonPackageAssets("agent", "AI agent starter", "agent"),
    rag: pythonApiAssets("rag", "RAG service", "rag"),
    "full-stack-ai": fullStackAssets(),
    microservices: microserviceAssets(),
    library: [
      file("package.json", `{"name":"project-library","private":true,"type":"module","scripts":{"test":"node --test","build":"tsc"},"devDependencies":{"@types/node":"^22.0.0","typescript":"^5.7.0"}}`),
      file("src/index.ts", "export function greet(name: string): string { return `Hello, ${name}`; }"),
      tsConfig, nodeCi(), ...nodeSecurity(),
    ],
    cli: [
      file("package.json", `{"name":"project-cli","private":true,"type":"module","scripts":{"test":"node --test","build":"tsc","start":"node dist/cli.js"},"devDependencies":{"@types/node":"^22.0.0","typescript":"^5.7.0"}}`),
      file("src/cli.ts", "#!/usr/bin/env node\nconsole.log('Configure CLI commands.');"),
      tsConfig, nodeCi(), ...nodeSecurity(),
    ],
    blank: [],
    enterprise: [file("docs/architecture/enterprise.md", "# Enterprise Architecture\n\nDocument domains, controls, and operational ownership."), file("docs/adr/0000-template-decision.md", "# ADR 0000: Template Decision\n\nRecord the application stack and deployment decisions before adding runtime configuration.")],
  };
  return assets[template] ?? [];
}

function pythonPackageAssets(packageName, title, entry = "app") {
  return [
    file("pyproject.toml", `[project]\nname = "project"\nversion = "0.1.0"\nrequires-python = ">=3.11"\n\n[tool.setuptools.packages.find]\nwhere = ["src"]`),
    file(`src/${packageName}/__init__.py`, ""),
    file(`src/${packageName}/main.py`, `def main() -> str:\n    return "${title}"`),
    file(`tests/unit/test_main.py`, `from ${packageName}.main import main\n\ndef test_main():\n    assert main() == "${title}"`),
    file("Dockerfile", `FROM python:3.12-slim\nWORKDIR /app\nRUN adduser --disabled-password --gecos \"\" appuser\nCOPY pyproject.toml ./\nCOPY src ./src\nRUN pip install --no-cache-dir .\nUSER appuser\nCMD [\"python\", \"-c\", \"from ${packageName}.main import main; print(main())\"]`),
    compose([{ name: "app" }]), pythonCi(), ...pythonSecurity(),
  ];
}
function pythonApiAssets(packageName, title, route) {
  return [
    file("pyproject.toml", `[project]\nname = "project"\nversion = "0.1.0"\nrequires-python = ">=3.11"\ndependencies = ["fastapi>=0.115", "uvicorn[standard]>=0.30"]\n\n[tool.setuptools.packages.find]\nwhere = ["src"]`),
    file(`src/${packageName}/__init__.py`, ""),
    file(`src/${packageName}/main.py`, `from fastapi import FastAPI\n\napp = FastAPI(title="${title}")\n\n@app.get("/health")\ndef health() -> dict[str, str]:\n    return {"status": "ok", "service": "${route}"}`),
    file("tests/unit/test_health.py", `from ${packageName}.main import health\n\ndef test_health():\n    assert health()["status"] == "ok"`),
    file("Dockerfile", `FROM python:3.12-slim\nWORKDIR /app\nRUN adduser --disabled-password --gecos \"\" appuser\nCOPY pyproject.toml ./\nCOPY src ./src\nRUN pip install --no-cache-dir .\nUSER appuser\nEXPOSE 8000\nCMD [\"uvicorn\", \"${packageName}.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]`),
    compose([{ name: "app", ports: "8000:8000" }]), pythonCi(), ...pythonSecurity(),
  ];
}
function fullStackAssets() {
  return [
    file("frontend/package.json", `{"private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start"},"dependencies":{"next":"^15.0.0","react":"^19.0.0","react-dom":"^19.0.0"}}`),
    file("frontend/app/page.tsx", "export default function Home() { return <main>Full Stack AI frontend</main>; }"),
    file("backend/pyproject.toml", "[project]\nname = \"backend\"\nrequires-python = \">=3.11\"\ndependencies = [\"fastapi>=0.115\", \"uvicorn[standard]>=0.30\"]"),
    file("backend/src/app/main.py", "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/health')\ndef health(): return {'status': 'ok'}"),
    file("frontend/Dockerfile", "FROM node:22-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install && npm run build\nEXPOSE 3000\nCMD [\"npm\", \"start\"]"),
    file("backend/Dockerfile", "FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nRUN pip install .\nEXPOSE 8000\nCMD [\"uvicorn\", \"src.app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]"),
    file("docker-compose.yml", "services:\n  frontend:\n    build: ./frontend\n    ports:\n      - \"3000:3000\"\n  backend:\n    build: ./backend\n    ports:\n      - \"8000:8000\""),
    file(".github/workflows/ci.yml", "name: CI\non: [push, pull_request]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo 'Run frontend and backend checks in their dedicated workflows.'"),
    ...mixedSecurity(),
  ];
}
function microserviceAssets() {
  return [
    file("services/gateway/package.json", `{"private":true,"type":"module","scripts":{"start":"node src/index.js"},"dependencies":{"express":"^5.0.0"}}`),
    file("services/gateway/src/index.js", "import express from 'express';\nconst app = express();\napp.get('/health', (_request, response) => response.json({ status: 'ok' }));\napp.listen(3000);"),
    file("services/catalog/README.md", "# Catalog Service\n\nDocument the contract, ownership, data, and operational dependencies."),
    file("services/gateway/Dockerfile", "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --omit=dev\nCOPY src ./src\nUSER node\nEXPOSE 3000\nCMD [\"npm\", \"start\"]"),
    file("docker-compose.yml", "services:\n  gateway:\n    build: ./services/gateway\n    ports:\n      - \"3000:3000\""),
    file(".github/workflows/ci.yml", "name: CI\non: [push, pull_request]\njobs:\n  gateway:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: cd services/gateway && npm install\n      - run: cd services/gateway && npm audit --omit=dev --audit-level=high"),
    ...nodeSecurity(),
  ];
}
