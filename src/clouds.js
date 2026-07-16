import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { credentialStatus, readCredential } from "./credentials.js";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const executeFile = promisify(execFile);

const CLOUDS = Object.freeze({
  vercel: { credential: "vercel", artifact: "vercel.json", product: "Vercel", executable: "vercel", verify: ["whoami"], deploy: ["deploy", "--prod", "--yes"], status: ["project", "ls"], contents: `${JSON.stringify({ version: 2, buildCommand: "npm run build" }, null, 2)}\n` },
  railway: { credential: "railway", artifact: "railway.json", product: "Railway", executable: "railway", verify: ["whoami"], deploy: ["up", "--detach"], status: ["status"], contents: `${JSON.stringify({ $schema: "https://railway.app/railway.schema.json", deploy: { startCommand: "npm start", restartPolicyType: "ON_FAILURE" } }, null, 2)}\n` },
  flyio: { credential: "flyio", artifact: "fly.toml", product: "Fly.io", executable: "flyctl", verify: ["auth", "whoami"], deploy: ["deploy", "--remote-only"], status: ["status"], contents: "app = \"replace-with-app-name\"\nprimary_region = \"iad\"\n\n[build]\n\n[http_service]\n  internal_port = 3000\n  force_https = true\n" },
  azure: { credential: "azure", artifact: "azure.yaml", product: "Azure", executable: "azd", verify: ["auth", "login", "--check-status"], deploy: ["up", "--no-prompt"], status: ["show"], contents: "name: replace-with-project-name\nservices:\n  app:\n    project: .\n    host: containerapp\n" },
  aws: { credential: "aws", artifact: path.join("cloud", "aws", "apprunner.yaml"), product: "AWS", executable: "aws", verify: ["sts", "get-caller-identity"], deploy: null, status: ["apprunner", "list-services"], contents: "version: 1.0\nruntime: nodejs20\nbuild:\n  commands:\n    build:\n      - npm install\nrun:\n  command: npm start\n" },
  googlecloud: { credential: "googlecloud", artifact: "app.yaml", product: "Google Cloud", executable: "gcloud", verify: ["auth", "list", "--filter=status:ACTIVE", "--format=json"], deploy: ["app", "deploy", "app.yaml", "--quiet"], status: ["app", "services", "list", "--format=json"], contents: "runtime: nodejs20\nenv: standard\n" },
  digitalocean: { credential: "digitalocean", artifact: path.join("cloud", "digitalocean", "app.yaml"), product: "DigitalOcean", executable: "doctl", verify: ["account", "get"], deploy: ["apps", "create", "--spec", "cloud/digitalocean/app.yaml"], status: ["apps", "list"], contents: "name: replace-with-project-name\nservices:\n  - name: app\n    github:\n      repo: replace-with-owner-repository\n      branch: main\n    run_command: npm start\n" },
});

export function listCloudPlatforms() { return Object.entries(CLOUDS).map(([name, value]) => ({ name, product: value.product, credential: value.credential, artifact: value.artifact, deploymentAutomatic: false })); }

export async function prepareCloudPlatform(root, name, { dryRun = true } = {}) {
  const cloud = definition(name);
  const documentation = path.join("docs", "cloud", `${name}.md`);
  const projectName = slug(path.basename(root));
  const contents = cloud.contents.replaceAll("replace-with-app-name", projectName).replaceAll("replace-with-project-name", projectName).replaceAll("replace-with-owner-repository", `owner/${projectName}`);
  const files = [{ relative: cloud.artifact, contents }, { relative: documentation, contents: guide(name, cloud) }];
  const create = [], skipped = [];
  for (const file of files) ((await exists(path.join(root, file.relative))) ? skipped : create).push(file);
  const plan = { cloud: name, product: cloud.product, dryRun, create: create.map(({ relative }) => relative), skipped: skipped.map(({ relative }) => relative), deploymentAutomatic: false, approvalRequiredForDeployment: true };
  if (dryRun) return plan;
  for (const file of create) { const target = path.join(root, file.relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, file.contents, { encoding: "utf8", flag: "wx" }); }
  await updateRegistry(root, name, "prepared");
  return { ...plan, dryRun: false, prepared: true };
}

export async function validateCloudPlatform(root, name) {
  const cloud = definition(name);
  const artifactExists = await exists(path.join(root, cloud.artifact));
  const credential = await credentialStatus(root, cloud.credential);
  const registry = await readCloudRegistry(root);
  const issues = [];
  if (!artifactExists) issues.push(`${cloud.artifact} is missing.`);
  if (!credential.configured) issues.push(`${credential.environmentVariable} is not configured.`);
  return { cloud: name, product: cloud.product, prepared: artifactExists, credential, registered: Boolean(registry[name]), valid: issues.length === 0, issues, deploymentAutomatic: false };
}

export async function cloudRollbackPlan(root, name) {
  const cloud = definition(name);
  const validation = await validateCloudPlatform(root, name);
  return { cloud: name, action: "rollback", automaticDeletion: false, prepared: validation.prepared, affectedPaths: [cloud.artifact, path.join("docs", "cloud", `${name}.md`), path.join(".ai-workspace", "cloud", "registry.json")], command: `Review the generated ${cloud.artifact} in version control and revert its creating commit if it has not been customized.`, externalResourcesChanged: false };
}

export async function cloudActionPlan(root, name, action, { execImpl = executeFile } = {}) {
  const cloud = definition(name);
  if (!["verify", "deploy", "status"].includes(action)) throw new Error("Cloud action must be verify, deploy, or status.");
  const validation = await validateCloudPlatform(root, name);
  const args = cloud[action];
  if (!args) return { cloud: name, product: cloud.product, action, executable: cloud.executable, executableAvailable: false, args: [], command: "Provide an approved AWS deployment target and account-specific source/role configuration.", scope: `${cloud.product} account`, dataImpact: "No external action is performed until account-specific deployment inputs are supplied.", affectedPaths: [cloud.artifact], rollback: "No deployment has occurred.", validation, ready: false, credential: cloud.credential, blockers: ["account-specific-deployment-input"] };
  const executableAvailable = await locateExecutable(cloud.executable, execImpl);
  return { cloud: name, product: cloud.product, action, executable: cloud.executable, executableAvailable, args, command: `${cloud.executable} ${args.join(" ")}`, scope: `${cloud.product} account`, dataImpact: action === "deploy" ? "May create or update billable cloud resources from the reviewed project configuration." : "Reads authenticated account and service metadata.", affectedPaths: [cloud.artifact, path.join(".ai-workspace", "cloud", "registry.json")], rollback: "Use cloud rollback planning and redeploy a reviewed known-good revision. Resources are never deleted automatically.", validation, ready: validation.prepared && validation.credential.configured && executableAvailable, credential: cloud.credential, blockers: [...(!validation.prepared ? ["configuration-artifact"] : []), ...(!validation.credential.configured ? ["credential"] : []), ...(!executableAvailable ? ["provider-cli"] : [])] };
}

export async function executeCloudAction(root, plan, { execImpl = executeFile } = {}) {
  if (!plan.ready) return { ...plan, executed: false, reason: "preflight-failed" };
  const secret = await readCredential(root, plan.credential);
  if (!secret) throw new Error(`Missing credential for ${plan.cloud}.`);
  const variable = plan.validation.credential.environmentVariable;
  try {
    const { stdout, stderr } = await execImpl(plan.executable, plan.args, { cwd: root, windowsHide: true, timeout: plan.action === "deploy" ? 900000 : 60000, maxBuffer: 5 * 1024 * 1024, env: { ...process.env, [variable]: secret } });
    const result = { cloud: plan.cloud, action: plan.action, executed: true, stdout: stdout.trim(), stderr: stderr.trim(), secretReturned: false };
    await updateRegistry(root, plan.cloud, plan.action === "deploy" ? "deployed" : plan.action === "verify" ? "credential-verified" : "healthy", { lastAction: plan.action, lastSuccessAt: new Date().toISOString() });
    return result;
  } catch (error) { throw new Error(`${plan.product} ${plan.action} failed: ${error.stderr?.trim() || error.message}`); }
}

function definition(name) { const cloud = CLOUDS[name]; if (!cloud) throw new Error(`Choose one of: ${Object.keys(CLOUDS).join(", ")}.`); return cloud; }
function guide(name, cloud) { return `# ${cloud.product}\n\nGenerated preparation artifact: \`${cloud.artifact}\`.\n\nConfigure the documented credential through the credential CLI or an approved secret manager. Review repository access, billing, regions, data residency, and service limits before deployment. This workspace does not deploy ${name} resources automatically.\n`; }
async function updateRegistry(root, name, status, metadata = {}) { const registry = await readCloudRegistry(root); registry[name] = { ...(registry[name] ?? {}), status, deploymentAutomatic: false, ...metadata, updatedAt: new Date().toISOString() }; await writeStateDocument(root, path.join(".ai-workspace", "cloud", "registry.json"), { schemaVersion: 1, platforms: registry }); }
async function readCloudRegistry(root) { return (await readStateDocument(root, path.join(".ai-workspace", "cloud", "registry.json"), { schemaVersion: 1, platforms: {} })).platforms ?? {}; }
async function exists(target) { try { await access(target); return true; } catch { return false; } }
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "workspace-app"; }
async function locateExecutable(executable, execImpl) { try { await execImpl(process.platform === "win32" ? "where.exe" : "which", [executable], { windowsHide: true, timeout: 5000 }); return true; } catch { return false; } }
