import { FileStateEngine } from "../state-engine.js";
export function createApplicationContext(root, overrides = {}) { return Object.freeze({ root, state: new FileStateEngine(root), clock: () => new Date(), ...overrides }); }
