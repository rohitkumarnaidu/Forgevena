import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const tools = {
  openspec: { description: "Spec-driven development CLI.", command: "npm", args: ["install", "-g", "@fission-ai/openspec@latest"], requires: ["Node.js 20.19+", "npm"], scope: "global Node.js package", dataImpact: "Downloads package metadata and files from the configured npm registry.", affectedPaths: ["global npm prefix"], rollback: "Use npm uninstall -g @fission-ai/openspec." },
  skillopt: { description: "Python skill optimizer.", command: "python", args: ["-m", "pip", "install", "skillopt"], requires: ["Python 3.10+", "API credentials for training"], scope: "active Python environment", dataImpact: "Downloads package metadata and files from the configured Python index.", affectedPaths: ["active Python environment"], rollback: "Use python -m pip uninstall skillopt." },
  gitnexus: { description: "Repository code-intelligence CLI.", command: "npx", args: ["gitnexus", "--help"], requires: ["Node.js 20+", "Git repository to analyze"], scope: "temporary npx execution", dataImpact: "May download a package to the npm cache; analysis is not run by this command.", affectedPaths: ["npm cache"], rollback: "No project files are changed by the help command." },
  gstack: { description: "Agent-host workflow skills.", manual: "Clone the upstream repository and run its setup script with `--host codex` (or another selected host).", requires: ["Git", "Bun", "selected AI coding agent"], scope: "agent host", dataImpact: "Host-specific skill installation and configuration.", affectedPaths: ["agent host skill directory"], rollback: "Use the upstream host-specific removal instructions." },
  "claude-mem": { description: "Persistent agent memory plugin.", manual: "Install using its official plugin/IDE integration after reviewing local data and model settings.", requires: ["Supported agent host", "Node.js", "Bun", "uv"], scope: "agent host", dataImpact: "May persist local session summaries and indexes.", affectedPaths: ["agent host plugin and memory directories"], rollback: "Use the upstream plugin removal instructions." },
  "understand-anything": { description: "Interactive code knowledge graph.", manual: "Install with the upstream plugin marketplace or platform installer for the chosen agent.", requires: ["Selected AI coding agent"], scope: "agent host", dataImpact: "May index the selected repository locally.", affectedPaths: ["agent host plugin and repository index"], rollback: "Use the upstream plugin removal instructions." }
};

export function listToolPlans() { return Object.entries(tools).map(([name, definition]) => ({ name, ...definition })); }
export async function installTool(name, { dryRun = true } = {}) {
  const definition = tools[name];
  if (!definition) throw new Error(`Choose one of: ${Object.keys(tools).join(", ")}.`);
  if (definition.manual) return { tool: name, applied: false, manual: true, description: definition.description, requires: definition.requires, nextStep: definition.manual };
  const plan = { tool: name, command: [definition.command, ...definition.args].join(" "), description: definition.description, requires: definition.requires, scope: definition.scope, dataImpact: definition.dataImpact, affectedPaths: definition.affectedPaths, rollback: definition.rollback, dryRun };
  if (dryRun) return plan;
  await exec(definition.command, definition.args, { windowsHide: true, cwd: os.homedir() });
  return { ...plan, dryRun: false, applied: true };
}
