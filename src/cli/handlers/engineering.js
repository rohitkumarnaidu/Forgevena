import path from "node:path";
import { readFile } from "node:fs/promises";
import { approveExternalAction } from "../../consent.js";
import { engineeringAssetStatus, installEngineeringAsset, listEngineeringAssets, removeEngineeringAsset, trustEngineeringAssetPublisher, verifyEngineeringAsset } from "../../engineering-assets.js";
import { engineeringCopilotPlan, runEngineeringCopilot } from "../../engineering-copilot.js";
import { buildProjectIndex, projectIndexStatus, projectRecommendations, queryProjectIndex } from "../../project-index.js";
import { buildSemanticIndex, configureSemanticIndex, querySemanticIndex, semanticIndexPlan, semanticIndexStatus } from "../../semantic-index.js";
import { loadWorkflow, planWorkflow, resumeWorkflow, startWorkflow, workflowStatus } from "../../workflow-engine.js";
import { commandError, parseCsv, positionalText, valueAfter } from "../options.js";

export async function skillsCommand(root, args, options = {}) {
  const [action = "list", subject, id] = args;
  if (action === "list") return { assets: await listEngineeringAssets(root, subject) };
  if (action === "trust") {
    if (!subject) throw commandError("CLI_SKILL_PUBLISHER_REQUIRED", "Usage: skills trust <publisher> --public-key-file <path> [--apply]", 2);
    const publicKeyFile = valueAfter(args, "--public-key-file");
    if (!publicKeyFile) throw commandError("CLI_SKILL_PUBLIC_KEY_REQUIRED", "Use --public-key-file <path-to-public-key.pem>.", 2);
    return trustEngineeringAssetPublisher(root, subject, await readFile(path.resolve(root, publicKeyFile), "utf8"), options);
  }
  if (action === "verify") {
    if (!subject) throw commandError("CLI_SKILL_MANIFEST_REQUIRED", "Usage: skills verify <manifest.json>", 2);
    return verifyEngineeringAsset(root, path.resolve(root, subject));
  }
  if (action === "install") {
    if (!subject) throw commandError("CLI_SKILL_MANIFEST_REQUIRED", "Usage: skills install <manifest.json> --principal <id> [--apply]", 2);
    return installEngineeringAsset(root, path.resolve(root, subject), { ...options, principal: valueAfter(args, "--principal") });
  }
  if (action === "status") {
    if (!subject || !id) throw commandError("CLI_SKILL_ID_REQUIRED", "Usage: skills status <prompt|skill> <id>", 2);
    return engineeringAssetStatus(root, subject, id);
  }
  if (action === "remove") {
    if (!subject || !id) throw commandError("CLI_SKILL_ID_REQUIRED", "Usage: skills remove <prompt|skill> <id> [--apply]", 2);
    return removeEngineeringAsset(root, subject, id, options);
  }
  throw commandError("CLI_SKILL_ACTION_INVALID", "Usage: skills <list|trust|verify|install|status|remove>", 2, { action });
}

export async function workflowsCommand(root, args, options = {}) {
  const [action = "plan", subject] = args;
  if (action === "validate" || action === "plan") {
    if (!subject) throw commandError("CLI_WORKFLOW_REQUIRED", `Usage: workflows ${action} <workflow.json>`, 2);
    const workflow = await loadWorkflow(path.resolve(root, subject));
    return action === "validate" ? { valid: true, workflow: workflow.id, version: workflow.version, order: workflow.order } : planWorkflow(workflow);
  }
  if (action === "run") {
    if (!subject) throw commandError("CLI_WORKFLOW_REQUIRED", "Usage: workflows run <workflow.json> [--run-id <id>] [--approve <nodes>] [--apply]", 2);
    return startWorkflow(root, await loadWorkflow(path.resolve(root, subject)), { runId: valueAfter(args, "--run-id"), approved: parseCsv(valueAfter(args, "--approve")), dryRun: options.dryRun });
  }
  if (action === "status") {
    if (!subject) throw commandError("CLI_WORKFLOW_RUN_REQUIRED", "Usage: workflows status <run-id>", 2);
    return workflowStatus(root, subject);
  }
  if (action === "resume") {
    if (!subject) throw commandError("CLI_WORKFLOW_RUN_REQUIRED", "Usage: workflows resume <run-id> [--approve <nodes>] [--apply]", 2);
    if (options.dryRun) return { ...(await workflowStatus(root, subject)), dryRun: true, proposedApprovals: parseCsv(valueAfter(args, "--approve")) };
    return resumeWorkflow(root, subject, { approved: parseCsv(valueAfter(args, "--approve")) });
  }
  throw commandError("CLI_WORKFLOW_ACTION_INVALID", "Usage: workflows <validate|plan|run|resume|status>", 2, { action });
}

export async function indexCommand(root, args, options = {}) {
  const [action = "status"] = args;
  if (action === "build") return buildProjectIndex(root, options);
  if (action === "status") return projectIndexStatus(root);
  if (action === "recommend") return projectRecommendations(root);
  if (action === "query") return queryProjectIndex(root, valueAfter(args, "--query") ?? positionalText(args, 1, ["--limit", "--query"]), { limit: valueAfter(args, "--limit") });
  throw commandError("CLI_INDEX_ACTION_INVALID", "Usage: index <build|status|query|recommend> [terms] [--limit <count>]", 2, { action });
}

export async function semanticCommand(root, args, options = {}) {
  const [action = "status"] = args;
  if (action === "configure") {
    const metadata = valueAfter(args, "--metadata");
    return configureSemanticIndex(root, { enabled: valueAfter(args, "--enabled") === undefined ? undefined : valueAfter(args, "--enabled") === "true", provider: valueAfter(args, "--provider"), model: valueAfter(args, "--model"), metadataFields: metadata === undefined ? undefined : parseCsv(metadata), maxEntries: valueAfter(args, "--max-entries") }, options);
  }
  if (action === "status") return semanticIndexStatus(root);
  if (action === "plan") return semanticIndexPlan(root, valueAfter(args, "--action") ?? "build");
  if (action === "build") {
    const plan = await semanticIndexPlan(root, "build");
    if (options.dryRun) return { ...plan, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await buildSemanticIndex(root)), approval };
  }
  if (action === "query") {
    const query = valueAfter(args, "--query") ?? positionalText(args, 1, ["--limit", "--query"]);
    const plan = await semanticIndexPlan(root, "query");
    if (options.dryRun) return { ...plan, query, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, query, approval };
    return { ...(await querySemanticIndex(root, query, { limit: valueAfter(args, "--limit") })), approval };
  }
  throw commandError("CLI_SEMANTIC_ACTION_INVALID", "Usage: semantic <configure|status|plan|build|query>", 2, { action });
}

export async function copilotCommand(root, args, options = {}) {
  const [action = "plan"] = args;
  const valuedFlags = ["--provider", "--model", "--principal", "--max-output-tokens", "--timeout-ms", "--objective"];
  const objective = valueAfter(args, "--objective") ?? positionalText(args, 1, valuedFlags);
  const settings = { provider: valueAfter(args, "--provider"), model: valueAfter(args, "--model"), principal: valueAfter(args, "--principal"), maxOutputTokens: valueAfter(args, "--max-output-tokens"), timeoutMs: valueAfter(args, "--timeout-ms") };
  const plan = await engineeringCopilotPlan(root, objective, settings);
  if (action === "plan") return plan;
  if (action === "run") {
    if (options.dryRun) return { ...plan, dryRun: true };
    const approval = await approveExternalAction(plan, options);
    if (!approval.approved) return { ...plan, approval };
    return { ...(await runEngineeringCopilot(root, objective, settings)), approval };
  }
  throw commandError("CLI_COPILOT_ACTION_INVALID", "Usage: copilot <plan|run> <objective> [--provider <name>] [--principal <id>]", 2, { action });
}
