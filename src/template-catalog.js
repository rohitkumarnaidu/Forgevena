const templates = ["react", "nextjs", "fastapi", "express", "flutter", "python", "ai-agent", "rag", "full-stack-ai", "microservices", "library", "cli", "blank", "enterprise"];
const providers = ["claude", "codex", "cursor", "gemini", "openai", "openrouter", "windsurf"];
export function listTemplates() { return templates; }
export function validateTemplate(name = "enterprise") { if (!templates.includes(name)) throw new Error(`Unsupported template: ${name}`); return name; }
export function validateProvider(name) { if (name && !providers.includes(name)) throw new Error(`Unsupported provider: ${name}`); return name ?? null; }
export function templateAssets(template) {
  const ci = (setup, test, build) => ({ path: ".github/workflows/stack-ci.yml", contents: `name: Stack CI\non: [push, pull_request]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: ${setup}\n      - run: ${test}\n      - run: ${build}\n` });
  const assets = {
    react: [{ path: "package.json", contents: "{\n  \"private\": true,\n  \"scripts\": { \"dev\": \"vite\", \"test\": \"vitest\", \"build\": \"vite build\" }\n}\n" }, ci("npm ci", "npm test -- --run", "npm run build")],
    nextjs: [{ path: "package.json", contents: "{\n  \"private\": true,\n  \"scripts\": { \"dev\": \"next dev\", \"build\": \"next build\" }\n}\n" }, ci("npm ci", "npm run lint --if-present", "npm run build")],
    fastapi: [{ path: "pyproject.toml", contents: "[project]\nname = \"project\"\nrequires-python = \">=3.11\"\ndependencies = [\"fastapi\", \"uvicorn\"]\n" }, ci("python -m pip install .", "python -m pytest", "python -m compileall src")],
    express: [{ path: "package.json", contents: "{\n  \"private\": true,\n  \"scripts\": { \"start\": \"node src/server.js\" }\n}\n" }],
    python: [{ path: "pyproject.toml", contents: "[project]\nname = \"project\"\nrequires-python = \">=3.11\"\n" }],
    flutter: [{ path: "pubspec.yaml", contents: "name: project\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\n" }]
    ,"ai-agent": [{ path: "pyproject.toml", contents: "[project]\nname = \"ai-agent\"\nrequires-python = \">=3.11\"\n" }]
    ,rag: [{ path: "pyproject.toml", contents: "[project]\nname = \"rag-app\"\nrequires-python = \">=3.11\"\n" }]
    ,"full-stack-ai": [{ path: "README.md", contents: "# Full Stack AI Project\n\nBackend and frontend boundaries are documented before implementation.\n" }]
    ,microservices: [{ path: "docs/architecture/services.md", contents: "# Service Boundaries\n\nDocument service ownership, APIs, data, and operational contracts.\n" }]
    ,library: [{ path: "src/index.js", contents: "export {};\n" }]
    ,cli: [{ path: "src/cli.js", contents: "#!/usr/bin/env node\nconsole.log('Configure CLI commands.');\n" }]
    ,blank: []
    ,enterprise: [{ path: "docs/architecture/enterprise.md", contents: "# Enterprise Architecture\n\nDocument domains, controls, and operational ownership.\n" }]
  };
  return assets[template] ?? [];
}
