export const CAPABILITY_MATURITY = Object.freeze(["experimental", "preview", "stable", "enterprise-certified", "deprecated"]);

const capabilities = {
  "specification-management": capability(["openspec"], "preview", "Govern specifications through an upstream integration."),
  "skill-optimization": capability(["skillopt"], "preview", "Optimize reusable agent skills through an upstream integration."),
  "ai-workflow": capability(["gstack"], "preview", "Apply governed AI engineering workflows."),
  "design-system": capability(["design-md", "astryx"], "preview", "Maintain agent-readable visual identity and design-system guidance."),
  "persistent-memory": capability(["claude-mem"], "preview", "Configure project-scoped persistent agent context."),
  "code-intelligence": capability(["gitnexus"], "preview", "Inspect repository structure through code-intelligence tooling."),
  "repository-knowledge-graph": capability(["understand-anything"], "preview", "Explore repository relationships through a knowledge graph.")
};

export function listCapabilities() { return Object.entries(capabilities).map(([name, value]) => ({ name, ...value })); }
export function resolveCapability(name, preferredIntegration) {
  const capability = capabilities[name];
  if (!capability) throw new Error(`Unknown capability: ${name}`);
  const integration = preferredIntegration ?? capability.integrations[0];
  if (!capability.integrations.includes(integration)) throw new Error(`${integration} does not implement ${name}.`);
  return { name, integration, alternatives: capability.integrations.filter((item) => item !== integration), maturity: capability.maturity, support: capability.support, evidence: capability.evidence };
}

function capability(integrations, maturity, description) {
  if (!CAPABILITY_MATURITY.includes(maturity)) throw new Error(`Unsupported capability maturity: ${maturity}`);
  return Object.freeze({ integrations: Object.freeze(integrations), maturity, support: "community", description, evidence: "docs/capabilities/reference.md" });
}
