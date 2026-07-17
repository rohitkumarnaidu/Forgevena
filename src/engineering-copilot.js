import { evaluateOrganizationPolicy, validateActiveOrganizationPolicy } from "./org-policy.js";
import { projectRecommendations, readProjectIndex } from "./project-index.js";
import { invokeProvider, providerDefinition } from "./provider-runtime.js";
import { readProjectProviderConfig } from "./provider-project.js";

const READ_ONLY_PROVIDERS = new Set(["openai", "claude", "gemini", "openrouter", "ollama"]);

export async function engineeringCopilotPlan(root, objective, options = {}) {
  const requestedObjective = String(objective ?? "").trim();
  if (!requestedObjective) throw new Error("Engineering copilot objective must not be empty.");
  const projectConfig = await readProjectProviderConfig(root);
  const provider = options.provider ?? projectConfig.defaultProvider;
  if (!READ_ONLY_PROVIDERS.has(provider)) throw new Error(`Read-only engineering copilot requires one of: ${[...READ_ONLY_PROVIDERS].join(", ")}.`);
  const definition = providerDefinition(provider);
  const index = await readProjectIndex(root);
  const recommendations = await projectRecommendations(root);
  const model = options.model ?? projectConfig.model ?? definition.defaultModel;
  const context = approvedContext(index, recommendations);
  return {
    action: "engineering-copilot.plan",
    objective: requestedObjective,
    provider,
    model,
    external: definition.kind === "model-api",
    command: `copilot run using ${provider}/${model}`,
    scope: definition.kind === "local-model" ? "local Ollama endpoint" : `${provider} model API`,
    dataImpact: "Sends the objective and approved project metadata summaries only. Source contents, credentials, and semantic vectors are excluded.",
    affectedPaths: [],
    rollback: "No project files or managed state are changed.",
    readOnly: true,
    projectFilesChanged: false,
    storesResponse: false,
    context,
  };
}

export async function runEngineeringCopilot(root, objective, options = {}, dependencies = {}) {
  const plan = await engineeringCopilotPlan(root, objective, options);
  const policyStatusImpl = dependencies.policyStatusImpl ?? validateActiveOrganizationPolicy;
  const authorizeImpl = dependencies.authorizeImpl ?? evaluateOrganizationPolicy;
  const policy = await policyStatusImpl(root);
  let authorization = { required: false, decision: "not-configured" };
  if (policy.configured) {
    if (!options.principal) throw new Error("An active organization policy requires --principal <id> for copilot execution.");
    const decision = await authorizeImpl(root, { principal: options.principal, action: "provider.invoke", resource: `provider:${plan.provider}`, capability: "engineering.plan" });
    if (decision.decision !== "allow") throw new Error(`Organization policy denied engineering copilot execution: ${decision.reason}.`);
    authorization = { required: true, ...decision };
  }
  const prompt = planningPrompt(plan.objective, plan.context);
  const invokeImpl = dependencies.invokeImpl ?? invokeProvider;
  const response = await invokeImpl(root, plan.provider, { prompt, model: plan.model, maxOutputTokens: options.maxOutputTokens, timeoutMs: options.timeoutMs });
  return { objective: plan.objective, provider: plan.provider, model: response.model ?? plan.model, text: response.text, usage: response.usage ?? null, requestId: response.requestId ?? null, readOnly: true, projectFilesChanged: false, responseStored: false, sourceContentSent: false, authorization };
}

function approvedContext(index, recommendations) {
  return {
    indexGeneratedAt: index.generatedAt,
    counts: index.counts,
    fileKinds: Object.fromEntries(["source", "document", "manifest"].map((kind) => [kind, index.files.filter((file) => file.kind === kind).length])),
    symbols: index.symbols.slice(0, 100).map(({ name, kind, file }) => ({ name, kind, file })),
    relationships: index.relationships.slice(0, 100).map(({ from, type, to }) => ({ from, type, to })),
    recommendations: recommendations.recommendations,
    contentIncluded: false,
  };
}

function planningPrompt(objective, context) {
  return [
    "You are a read-only engineering planning assistant.",
    "Return a concise implementation plan, risks, validation steps, and documentation impact.",
    "Do not claim to edit files, execute commands, deploy, or access source contents.",
    `Objective: ${objective}`,
    `Approved metadata context: ${JSON.stringify(context)}`,
  ].join("\n\n");
}
