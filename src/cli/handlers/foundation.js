import {
  auditCredentialVault,
  backupCredentials,
  configureCredential,
  credentialStatus,
  initializeCredentialPlaceholders,
  listCredentialDefinitions,
  migrateLegacyCredential,
  recoverCredential,
  removeCredential,
  rotateCredential,
  validateCredential,
} from "../../credentials.js";
import { promptSecret } from "../../secret-prompt.js";
import { migrateState, repairState, snapshotState, stateHistory, stateStatus } from "../../state-service.js";
import { commandError, valueAfter } from "../options.js";

export const foundationServices = Object.freeze({
  auditCredentialVault,
  backupCredentials,
  configureCredential,
  credentialStatus,
  initializeCredentialPlaceholders,
  listCredentialDefinitions,
  migrateLegacyCredential,
  migrateState,
  promptSecret,
  recoverCredential,
  removeCredential,
  repairState,
  rotateCredential,
  snapshotState,
  stateHistory,
  stateStatus,
  validateCredential,
});

export async function stateCommand(context, args, options, services = foundationServices) {
  const [action = "validate"] = args;
  if (action === "validate") return services.stateStatus(context.root);
  if (action === "repair") return services.repairState(context.root, options);
  if (action === "snapshot") return services.snapshotState(context.root, options);
  if (action === "migrate") return services.migrateState(context.root, options);
  if (action === "history") return services.stateHistory(context.root);
  throw commandError("CLI_STATE_ACTION_INVALID", "Usage: state <validate|repair|snapshot|migrate|history>", 2, { action });
}

export async function vaultCommand(root, args, options, services = foundationServices) {
  const [action = "audit", name] = args;
  if (action === "initialize") return services.initializeCredentialPlaceholders(root, options);
  if (action === "rotate") return credentialCommand(root, ["rotate", name, ...args.slice(2)], options, services);
  if (action === "recover") {
    if (!name) throw commandError("CLI_VAULT_CREDENTIAL_REQUIRED", "Usage: vault recover <credential> [--apply]", 2);
    return services.recoverCredential(root, name, options);
  }
  if (action === "migrate") {
    if (!name) throw commandError("CLI_VAULT_CREDENTIAL_REQUIRED", "Usage: vault migrate <credential> [--apply --yes]", 2);
    return services.migrateLegacyCredential(root, name, options);
  }
  if (action === "audit") return services.auditCredentialVault(root);
  throw commandError("CLI_VAULT_ACTION_INVALID", "Usage: vault <initialize|rotate|recover|migrate|audit> [credential]", 2, { action });
}

export async function credentialCommand(root, args, options, services = foundationServices) {
  const [action = "list", name] = args;
  const definitions = services.listCredentialDefinitions();
  const allStatuses = () => Promise.all(definitions.map(({ name: credential }) => services.credentialStatus(root, credential)));
  if (action === "list") return { credentials: await allStatuses() };
  if (action === "init") return services.initializeCredentialPlaceholders(root, options);
  if (action === "status") return name ? services.credentialStatus(root, name) : { credentials: await allStatuses() };
  if (action === "configure") return configureCredentialInteractively(root, name, args, options, services);
  if (action === "validate") return name
    ? services.validateCredential(root, name)
    : { credentials: await Promise.all(definitions.map(({ name: credential }) => services.validateCredential(root, credential))) };
  if (action === "backup") return services.backupCredentials(root, options);
  if (action === "remove") return services.removeCredential(root, name, options);
  if (action === "rotate") {
    const storage = valueAfter(args, "--storage") ?? "local";
    const preview = await services.rotateCredential(root, name, undefined, { dryRun: true, storage });
    if (options.dryRun || preview.manualRequired) return preview;
    if (options.nonInteractive) throw commandError("CLI_CREDENTIAL_INTERACTIVE_REQUIRED", "Credential rotation requires masked interactive input or an external secret manager.", 2);
    const secret = await services.promptSecret(`Enter the replacement credential for ${name} (input is masked): `);
    return services.rotateCredential(root, name, secret, { dryRun: false, storage });
  }
  throw commandError("CLI_CREDENTIAL_ACTION_INVALID", "Usage: credentials <init|list|configure|rotate|validate|status|backup|remove> [provider-or-cloud]", 2, { action });
}

async function configureCredentialInteractively(root, name, args, options, services) {
  if (!name) throw commandError("CLI_CREDENTIAL_REQUIRED", "Choose a provider credential or render.", 2);
  const storage = valueAfter(args, "--storage") ?? "local";
  const preview = await services.configureCredential(root, name, undefined, { dryRun: true, storage });
  if (options.dryRun) return preview;
  if (options.nonInteractive) throw commandError("CLI_CREDENTIAL_INTERACTIVE_REQUIRED", `Masked ${preview.environmentVariable} entry is unavailable in non-interactive mode. Set the environment variable through your secret manager.`, 2);
  const secret = await services.promptSecret(`Enter ${preview.environmentVariable} for ${name} (input is masked): `);
  return services.configureCredential(root, name, secret, { dryRun: false, storage });
}
