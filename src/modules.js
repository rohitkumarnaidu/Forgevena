import { moduleFiles } from "./templates.js";

const names = ["core", "doctor", "bootstrap", "registry", "logging", "config", "templates", "providers", "project", "docs", "design", "testing", "docker", "monitoring", "github", "ai"];

export function supportedModules() { return names; }
export function moduleContract(name) {
  if (!names.includes(name)) throw new Error(`Unsupported module: ${name}`);
  return { name, initialize: () => moduleFiles(name), validate: () => true, install: () => moduleFiles(name), update: () => moduleFiles(name), status: () => ({ name }), remove: () => ({ name, supported: false }), rollback: () => ({ name, supported: true }) };
}
