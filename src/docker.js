import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { templateRequiredAssets } from "./template-catalog.js";

const exec = promisify(execFile);

export async function validateDockerAssets(root, template) {
  const required = templateRequiredAssets(template).filter((asset) => asset === ".dockerignore" || asset.includes("Dockerfile") || asset.startsWith("docker-compose"));
  const checks = await Promise.all(required.map(async (relative) => [relative, await exists(path.join(root, relative))]));
  const missing = checks.filter(([, present]) => !present).map(([relative]) => relative);
  const composePath = (await exists(path.join(root, "docker-compose.production.yml"))) ? "docker-compose.production.yml" : "docker-compose.yml";
  const compose = await readOptional(path.join(root, composePath));
  const structuralIssues = [];
  if (compose && !/^services:/m.test(compose)) structuralIssues.push(`${composePath} does not declare services.`);
  if (compose && composePath === "docker-compose.production.yml" && !/restart: unless-stopped/m.test(compose)) structuralIssues.push(`${composePath} is missing the production restart policy.`);
  return { root, template, valid: missing.length === 0 && structuralIssues.length === 0, composePath, required: Object.fromEntries(checks), missing, structuralIssues };
}

export async function dockerPlan(root, template, action = "plan") {
  const validation = await validateDockerAssets(root, template);
  const composePath = validation.composePath;
  const commandArgs = action === "down" ? ["compose", "-f", composePath, "down"] : ["compose", "-f", composePath, "up", "-d", "--build"];
  return {
    action,
    template,
    command: `docker ${commandArgs.join(" ")}`,
    args: commandArgs,
    validation,
    scope: "local Docker daemon",
    dataImpact: action === "down" ? "Stops and removes Compose-managed containers and networks." : "Builds local images and starts Compose-managed containers and networks.",
    affectedPaths: [composePath, "local Docker image, container, and network storage"],
    rollback: "Run docker down through the same approved Compose profile.",
  };
}

export async function executeDockerPlan(plan) {
  if (!plan.validation.valid) throw new Error(`Docker assets are not valid: ${[...plan.validation.missing, ...plan.validation.structuralIssues].join("; ")}`);
  const { stdout, stderr } = await exec("docker", plan.args, { cwd: plan.validation.root, windowsHide: true });
  return { action: plan.action, executed: true, stdout: stdout.trim(), stderr: stderr.trim(), command: plan.command };
}

async function exists(target) { try { await access(target); return true; } catch { return false; } }
async function readOptional(target) { try { return await readFile(target, "utf8"); } catch { return ""; } }
