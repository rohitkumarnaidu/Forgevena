import { FileStateEngine } from "../state-engine.js";
export function createApplicationContext(root, overrides = {}) {
  const { services = {}, ...values } = overrides;
  if (!services || typeof services !== "object" || Array.isArray(services)) throw new TypeError("Application context services must be an object.");
  return Object.freeze({ root, state: new FileStateEngine(root), clock: () => new Date(), ...values, services: Object.freeze({ ...services }) });
}
