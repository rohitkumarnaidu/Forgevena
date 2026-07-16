import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

export const PLATFORM_VERSION = packageJson.version;
export const REGISTRY_SCHEMA_VERSION = 2;
export function versionInfo() {
  const [core, prerelease = null] = PLATFORM_VERSION.split("-");
  const [major, minor, patch] = core.split(".").map(Number);
  return { version: PLATFORM_VERSION, major, minor, patch, prerelease, registrySchemaVersion: REGISTRY_SCHEMA_VERSION };
}
