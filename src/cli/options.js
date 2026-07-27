export function parseGlobalOptions(args) {
  if (args.includes("--apply") && args.includes("--dry-run")) throw commandError("CLI_OPTION_CONFLICT", "Choose either --apply or --dry-run, not both.", 2);
  const apply = args.includes("--apply") || args.includes("--yes");
  return { dryRun: !apply, apply, yes: args.includes("--yes"), force: args.includes("--force"), nonInteractive: args.includes("--non-interactive"), verbose: args.includes("--verbose"), structured: args.includes("--structured"), mergePolicy: valueAfter(args, "--merge") ?? "skip", skip: valueAfter(args, "--skip")?.split(",").filter(Boolean) ?? [] };
}
export function stripGlobalOptions(args) {
  const flags = new Set(["--apply", "--dry-run", "--yes", "--force", "--non-interactive", "--verbose", "--structured"]);
  const valued = new Set(["--merge", "--skip"]);
  const result = [];
  for (let index = 0; index < args.length; index += 1) {
    if (flags.has(args[index])) continue;
    if (valued.has(args[index])) { index += 1; continue; }
    result.push(args[index]);
  }
  return result;
}
export function parseCsv(value) { return value?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? []; }
export function positionalText(args, start, valuedFlags) {
  const values = [];
  for (let index = start; index < args.length; index += 1) {
    if (valuedFlags.includes(args[index])) { index += 1; continue; }
    if (!args[index].startsWith("--")) values.push(args[index]);
  }
  return values.join(" ");
}
export function valueAfter(args, flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
export function commandError(code, message, exitCode = 1, details = {}) { const error = new Error(message); error.code = code; error.exitCode = exitCode; error.details = details; return error; }
