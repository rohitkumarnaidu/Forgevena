import { FileStateEngine } from "./state-engine.js";

export async function readStateDocument(root, relativePath, fallback, validate = objectDocument) {
  return new FileStateEngine(root).read(relativePath, { fallback, validate });
}

export async function writeStateDocument(root, relativePath, value, validate = objectDocument) {
  return new FileStateEngine(root).write(relativePath, value, { validate });
}

export async function updateStateDocument(root, relativePath, updater, fallback, validate = objectDocument) {
  return new FileStateEngine(root).update(relativePath, updater, { fallback, validate });
}

export function objectDocument(value) { return value && typeof value === "object" && !Array.isArray(value) ? true : ["State document must be an object."]; }
