export function parseGlobalOptions(args) {
  if (args.includes("--apply") && args.includes("--dry-run")) throw commandError("CLI_OPTION_CONFLICT", "Choose either --apply or --dry-run, not both.", 2);
  const apply = args.includes("--apply") || args.includes("--yes");
  return { dryRun: !apply, apply, yes: args.includes("--yes"), force: args.includes("--force"), nonInteractive: args.includes("--non-interactive"), verbose: args.includes("--verbose"), structured: args.includes("--structured"), mergePolicy: valueAfter(args, "--merge") ?? "skip", skip: valueAfter(args, "--skip")?.split(",").filter(Boolean) ?? [] };
}
export function valueAfter(args, flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
export function commandError(code, message, exitCode = 1, details = {}) { const error = new Error(message); error.code = code; error.exitCode = exitCode; error.details = details; return error; }
