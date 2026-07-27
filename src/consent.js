import process from "node:process";
import { createInterface } from "node:readline/promises";

export async function approveExternalAction(plan, { dryRun = true, apply = false, yes = false, nonInteractive = false, input = process.stdin, output = process.stdout, promptFactory = createInterface } = {}) {
  if (dryRun || !apply) return { approved: false, reason: "preview", plan };
  if (yes) return { approved: true, reason: "explicit-yes", plan };
  if (nonInteractive || !input.isTTY || !output.isTTY) {
    throw new Error("External actions require --yes when using --apply in a non-interactive session.");
  }
  const prompt = promptFactory({ input, output });
  try {
    const answer = await prompt.question(`This action may access the network and change your developer environment. Run \"${plan.command}\"? [y/N] `);
    if (answer.trim().toLowerCase() !== "y") throw new Error("External action cancelled by the user.");
    return { approved: true, reason: "interactive-confirmation", plan };
  } finally {
    prompt.close();
  }
}
