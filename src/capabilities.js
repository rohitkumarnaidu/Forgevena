const capabilities = {
  "specification-management": { integrations: ["openspec"] },
  "skill-optimization": { integrations: ["skillopt"] },
  "ai-workflow": { integrations: ["gstack"] },
  "design-system": { integrations: ["design-md", "astryx"] },
  "persistent-memory": { integrations: ["claude-mem"] },
  "code-intelligence": { integrations: ["gitnexus"] },
  "repository-knowledge-graph": { integrations: ["understand-anything"] }
};

export function listCapabilities() { return Object.entries(capabilities).map(([name, value]) => ({ name, ...value })); }
export function resolveCapability(name, preferredIntegration) {
  const capability = capabilities[name];
  if (!capability) throw new Error(`Unknown capability: ${name}`);
  const integration = preferredIntegration ?? capability.integrations[0];
  if (!capability.integrations.includes(integration)) throw new Error(`${integration} does not implement ${name}.`);
  return { name, integration, alternatives: capability.integrations.filter((item) => item !== integration) };
}
