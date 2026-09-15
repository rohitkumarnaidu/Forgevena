import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dashboard-next");

test("Next command center contains the documented route surface", async () => {
  for (const route of ["page.jsx", "workspace/page.jsx", "agents/page.jsx", "runs/page.jsx", "providers/page.jsx", "capabilities/page.jsx", "integrations/page.jsx", "updates/page.jsx", "evidence/page.jsx", "releases/page.jsx", "activity/page.jsx", "security/page.jsx", "settings/page.jsx"]) {
    const source = await readFile(path.join(root, "app", route), "utf8");
    assert.ok(source.length > 100, `route is not implemented: ${route}`);
  }
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  for (const label of ["Overview", "Workspace", "Agents", "Runs", "Providers", "Capabilities", "Integrations", "Updates", "Evidence", "Releases", "Audit history", "Security", "Settings"]) assert.match(readme, new RegExp(`- \\*\\*${label}:`));
});

test("Next command center proxy is authenticated and allowlisted", async () => {
  const route = await readFile(path.join(root, "app", "api", "forgevena", "[...path]", "route.js"), "utf8");
  assert.match(route, /x-ai-workspace-session/);
  assert.match(route, /route_not_allowed/);
  assert.match(route, /agents\/plan/);
  assert.match(route, /workflows\/plan/);
  assert.doesNotMatch(route, /workflows\/run/);
  assert.match(route, /cache-control.*no-store/);
});
