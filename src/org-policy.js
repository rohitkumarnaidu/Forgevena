import { createHash, createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { readStateDocument, writeStateDocument } from "./state-documents.js";

const POLICY_PATH = path.join(".ai-workspace", "org", "policy.json");
const TRUST_PATH = path.join(".ai-workspace", "org", "trusted-signers.json");
const AUDIT_PATH = path.join(".ai-workspace", "org", "audit.json");

export class OrganizationPolicyError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "OrganizationPolicyError"; this.code = code; this.details = details; }
}

export async function trustOrganizationSigner(root, signer, publicKeyPem, { dryRun = true } = {}) {
  if (!safeId(signer)) throw new OrganizationPolicyError("ORG_SIGNER_INVALID", "Signer id must use 1-64 safe characters.");
  try { createPublicKey(publicKeyPem); } catch { throw new OrganizationPolicyError("ORG_SIGNER_KEY_INVALID", "Signer key must be a valid public key in PEM format."); }
  const trust = await readTrust(root);
  if (trust.signers[signer]) return { signer, dryRun, trusted: false, skipped: true, message: "Signer already exists and was not overwritten." };
  const fingerprint = createHash("sha256").update(publicKeyPem).digest("hex");
  if (dryRun) return { signer, fingerprint, dryRun, create: [TRUST_PATH], storesPrivateKey: false };
  trust.signers[signer] = { publicKeyPem, fingerprint, trustedAt: new Date().toISOString() };
  await writeStateDocument(root, TRUST_PATH, trust, validateTrustStore);
  return { signer, fingerprint, trusted: true, dryRun: false, storesPrivateKey: false };
}

export async function importOrganizationPolicy(root, source, { dryRun = true } = {}) {
  const bundle = validateOrganizationPolicy(JSON.parse(await readFile(path.resolve(source), "utf8")));
  const signature = await verifyOrganizationPolicy(root, bundle);
  if (!signature.trusted) throw new OrganizationPolicyError("ORG_POLICY_UNTRUSTED", `Organization policy signature is not trusted: ${signature.reason}.`);
  const plan = { organization: bundle.organization.id, version: bundle.version, signer: bundle.signature.signer, dryRun, path: POLICY_PATH, signature, overwriteManagedPolicy: true };
  if (dryRun) return plan;
  await writeStateDocument(root, POLICY_PATH, bundle, validateOrganizationPolicyDocument);
  await appendAudit(root, { action: "policy.import", organization: bundle.organization.id, version: bundle.version, signer: bundle.signature.signer, decision: "allow" });
  return { ...plan, dryRun: false, imported: true };
}

export async function validateActiveOrganizationPolicy(root) {
  const bundle = await readStateDocument(root, POLICY_PATH, null, (value) => value === null || validateOrganizationPolicyDocument(value));
  if (!bundle) return { configured: false, valid: false, issues: ["No active organization policy is configured."] };
  try { const validated = validateOrganizationPolicy(bundle); const signature = await verifyOrganizationPolicy(root, validated); return { configured: true, valid: signature.trusted, organization: validated.organization.id, version: validated.version, signature }; }
  catch (error) { return { configured: true, valid: false, issues: [error.message], error: { code: error.code ?? "ORG_POLICY_INVALID" } }; }
}

export async function evaluateOrganizationPolicy(root, request) {
  const bundle = await readStateDocument(root, POLICY_PATH, null, (value) => value === null || validateOrganizationPolicyDocument(value));
  if (!bundle) return { decision: "deny", reason: "no-active-policy", request: sanitizeRequest(request) };
  const signature = await verifyOrganizationPolicy(root, validateOrganizationPolicy(bundle));
  if (!signature.trusted) return { decision: "deny", reason: "untrusted-policy", request: sanitizeRequest(request) };
  const principal = bundle.principals.find((entry) => entry.id === request.principal);
  if (!principal) return recordDecision(root, bundle, request, "deny", "unknown-principal", []);
  const roles = bundle.roles.filter((role) => principal.roles.includes(role.id));
  const statements = [...roles.flatMap((role) => role.statements), ...bundle.rules];
  const matches = statements.filter((statement) => matchesStatement(statement, request));
  const denied = matches.filter((statement) => statement.effect === "deny");
  const allowed = matches.filter((statement) => statement.effect === "allow");
  const decision = denied.length ? "deny" : allowed.length ? "allow" : "deny";
  const reason = denied.length ? "explicit-deny" : allowed.length ? "explicit-allow" : "implicit-deny";
  return recordDecision(root, bundle, request, decision, reason, matches);
}

export async function organizationComplianceReport(root) {
  const validation = await validateActiveOrganizationPolicy(root);
  const bundle = validation.valid ? await readStateDocument(root, POLICY_PATH) : null;
  return { ...validation, localOnly: true, denyOverrides: true, approvedProviders: bundle?.approvals.providers ?? [], approvedPlugins: bundle?.approvals.plugins ?? [], approvedTemplates: bundle?.approvals.templates ?? [], principals: bundle?.principals.length ?? 0, roles: bundle?.roles.length ?? 0, auditEntries: (await readAudit(root)).entries.length };
}

export async function organizationAudit(root) { return readAudit(root); }

export async function verifyOrganizationPolicy(root, bundle) {
  const { signer, algorithm, value } = bundle.signature ?? {};
  if (algorithm !== "ed25519" || !signer || !value) return { present: Boolean(bundle.signature), trusted: false, reason: "signature metadata is invalid" };
  const record = (await readTrust(root)).signers[signer];
  if (!record) return { present: true, trusted: false, signer, reason: "signer is not trusted" };
  let valid = false;
  try { valid = verify(null, Buffer.from(canonicalOrganizationPolicy(bundle)), createPublicKey(record.publicKeyPem), Buffer.from(value, "base64")); } catch { valid = false; }
  return { present: true, trusted: valid, signer, algorithm, fingerprint: record.fingerprint, reason: valid ? null : "signature verification failed" };
}

export function canonicalOrganizationPolicy(bundle) { const { signature: _signature, ...unsigned } = bundle; return JSON.stringify(sortObject(unsigned)); }

export function validateOrganizationPolicy(value) {
  if (value?.schemaVersion !== 1) throw new OrganizationPolicyError("ORG_POLICY_SCHEMA_INVALID", "Organization policy schemaVersion must be 1.");
  if (!safeId(value.organization?.id) || !value.organization?.name) throw new OrganizationPolicyError("ORG_POLICY_ORGANIZATION_INVALID", "Organization policy requires a safe organization id and name.");
  if (!/^\d+\.\d+\.\d+$/.test(value.version ?? "")) throw new OrganizationPolicyError("ORG_POLICY_VERSION_INVALID", "Organization policy version must use semantic versioning.");
  const roles = array(value.roles, "roles").map((role) => ({ id: requiredId(role.id, "role"), statements: array(role.statements, "role statements").map(validateStatement) }));
  const roleIds = new Set(roles.map(({ id }) => id));
  const principals = array(value.principals, "principals").map((principal) => { const assigned = array(principal.roles, "principal roles").map(String); if (assigned.some((role) => !roleIds.has(role))) throw new OrganizationPolicyError("ORG_POLICY_ROLE_UNKNOWN", `Principal ${principal.id} references an unknown role.`); return { id: requiredId(principal.id, "principal"), roles: assigned }; });
  const approvals = value.approvals ?? {};
  return { schemaVersion: 1, organization: { id: value.organization.id, name: String(value.organization.name) }, version: value.version, projects: uniqueIds(value.projects ?? [], "project"), workspaces: uniqueIds(value.workspaces ?? [], "workspace"), principals, roles, approvals: { providers: uniqueStrings(approvals.providers), plugins: uniqueStrings(approvals.plugins), templates: uniqueStrings(approvals.templates) }, rules: array(value.rules ?? [], "rules").map(validateStatement), signature: value.signature };
}

function validateStatement(statement) { if (!['allow', 'deny'].includes(statement?.effect)) throw new OrganizationPolicyError("ORG_POLICY_EFFECT_INVALID", "Policy effect must be allow or deny."); return { effect: statement.effect, actions: uniqueStrings(statement.actions), resources: uniqueStrings(statement.resources), capabilities: uniqueStrings(statement.capabilities) }; }
function matchesStatement(statement, request) { return matchAny(statement.actions, request.action) && matchAny(statement.resources, request.resource ?? "*") && (!statement.capabilities.length || matchAny(statement.capabilities, request.capability ?? "")); }
function matchAny(patterns, value) { return patterns.some((pattern) => pattern === "*" || pattern === value || (pattern.endsWith("*") && value.startsWith(pattern.slice(0, -1)))); }
async function recordDecision(root, bundle, request, decision, reason, statements) { await appendAudit(root, { action: request.action, resource: request.resource ?? "*", capability: request.capability ?? null, principal: request.principal, organization: bundle.organization.id, decision, reason }); return { decision, reason, request: sanitizeRequest(request), matchedStatements: statements.length, denyOverrides: true }; }
async function appendAudit(root, entry) { const audit = await readAudit(root); audit.entries.push({ ...entry, at: new Date().toISOString() }); if (audit.entries.length > 1000) audit.entries = audit.entries.slice(-1000); await writeStateDocument(root, AUDIT_PATH, audit, validateAudit); }
async function readAudit(root) { return { schemaVersion: 1, entries: [], ...(await readStateDocument(root, AUDIT_PATH, { schemaVersion: 1, entries: [] }, validateAudit)) }; }
async function readTrust(root) { return { schemaVersion: 1, signers: {}, ...(await readStateDocument(root, TRUST_PATH, { schemaVersion: 1, signers: {} }, validateTrustStore)) }; }
function sanitizeRequest(request) { return { principal: String(request.principal ?? ""), action: String(request.action ?? ""), resource: String(request.resource ?? "*"), capability: request.capability ? String(request.capability) : null }; }
function validateOrganizationPolicyDocument(value) { try { validateOrganizationPolicy(value); return true; } catch (error) { return [error.message]; } }
function validateTrustStore(value) { return value?.schemaVersion === 1 && value.signers && typeof value.signers === "object" ? true : ["Organization signer trust store is invalid."]; }
function validateAudit(value) { return value?.schemaVersion === 1 && Array.isArray(value.entries) ? true : ["Organization audit document is invalid."]; }
function requiredId(value, label) { if (!safeId(value)) throw new OrganizationPolicyError("ORG_POLICY_ID_INVALID", `${label} id must use safe characters.`); return value; }
function uniqueIds(values, label) { return array(values, `${label}s`).map((entry) => typeof entry === "string" ? { id: requiredId(entry, label) } : { id: requiredId(entry.id, label), name: String(entry.name ?? entry.id) }); }
function uniqueStrings(values = []) { return [...new Set((Array.isArray(values) ? values : []).map(String))]; }
function array(value, label) { if (!Array.isArray(value)) throw new OrganizationPolicyError("ORG_POLICY_ARRAY_INVALID", `${label} must be an array.`); return value; }
function safeId(value) { return /^[a-z0-9][a-z0-9._@-]{0,127}$/i.test(value ?? ""); }
function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])); return value; }
