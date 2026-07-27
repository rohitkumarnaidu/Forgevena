import path from "node:path";
import { readFile } from "node:fs/promises";
import { valueAfter, commandError } from "../options.js";
import {
  evaluateOrganizationPolicy,
  importOrganizationPolicy,
  organizationAudit,
  organizationComplianceReport,
  trustOrganizationSigner,
  validateActiveOrganizationPolicy,
} from "../../org-policy.js";
import { createDiagnosticBundle, diagnosticsHealth, diagnosticsProfile, readMetrics, readTraces } from "../../diagnostics.js";
import { generateSupplyChainArtifacts, scanRepositorySecrets, verifySupplyChainArtifacts, verifySupplyChainReadiness } from "../../supply-chain.js";

export async function organizationCommand(root, args, options = {}) {
  const [action = "validate", subject] = args;
  if (action === "trust") {
    if (!subject) throw commandError("CLI_ORG_SIGNER_REQUIRED", "Usage: org trust <signer> --public-key-file <path> [--apply]", 2);
    const publicKeyFile = valueAfter(args, "--public-key-file");
    if (!publicKeyFile) throw commandError("CLI_ORG_PUBLIC_KEY_REQUIRED", "Use --public-key-file <path-to-public-key.pem>.", 2);
    return trustOrganizationSigner(root, subject, await readFile(path.resolve(root, publicKeyFile), "utf8"), options);
  }
  if (action === "import") {
    if (!subject) throw commandError("CLI_ORG_POLICY_REQUIRED", "Usage: org import <policy.json> [--apply]", 2);
    return importOrganizationPolicy(root, path.resolve(root, subject), options);
  }
  if (action === "validate") return validateActiveOrganizationPolicy(root);
  if (action === "audit") return organizationAudit(root);
  if (action === "compliance") return organizationComplianceReport(root);
  if (action === "evaluate") {
    const principal = valueAfter(args, "--principal");
    const requestedAction = valueAfter(args, "--action");
    if (!principal || !requestedAction) throw commandError("CLI_ORG_EVALUATION_INVALID", "Use --principal <id> --action <action> [--resource <resource>] [--capability <capability>].", 2);
    return evaluateOrganizationPolicy(root, { principal, action: requestedAction, resource: valueAfter(args, "--resource") ?? "*", capability: valueAfter(args, "--capability") });
  }
  throw commandError("CLI_ORG_ACTION_INVALID", "Usage: org <trust|import|validate|evaluate|audit|compliance>", 2, { action });
}

export async function diagnosticsCommand(root, args, options = {}) {
  const [action = "health"] = args;
  if (action === "health") return diagnosticsHealth(root);
  if (action === "metrics") return readMetrics(root);
  if (action === "traces") return readTraces(root);
  if (action === "profile") return diagnosticsProfile(root);
  if (action === "bundle") return createDiagnosticBundle(root, options);
  throw commandError("CLI_DIAGNOSTICS_ACTION_INVALID", "Usage: diagnostics <health|bundle|metrics|traces|profile>", 2, { action });
}

export async function supplyChainCommand(root, args, options = {}) {
  const [action = "verify"] = args;
  if (action === "verify") return verifySupplyChainReadiness(root);
  if (action === "scan") return scanRepositorySecrets(root);
  if (action === "generate") return generateSupplyChainArtifacts(root, options);
  if (action === "artifacts") return verifySupplyChainArtifacts(root);
  throw commandError("CLI_SUPPLY_CHAIN_ACTION_INVALID", "Usage: supply-chain <verify|scan|generate|artifacts>", 2, { action });
}
