import { BranchArgsError, parseBranchArgs } from "../branch/inline.js";
import { runBranchPrompt } from "../branch/prompt.js";
import { validateBranchName } from "../branch/validate.js";
import { ConfigError } from "../config/types.js";
import { loadConfig } from "../config/loader.js";
import { runGitBranch } from "../git/branch.js";
import { PromptCancelledError } from "../prompt/commit-prompt.js";

function handleConfigError(error: unknown): never {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

function printValidationResult(name: string, valid: boolean, reason?: string): void {
  if (valid) {
    console.log(`Valid branch name: ${name}`);
    return;
  }
  console.error(reason ?? "Invalid branch name.");
}

export async function runBranchCommand(args: string[]): Promise<void> {
  let parsed;
  try {
    parsed = parseBranchArgs(args);
  } catch (error) {
    if (error instanceof BranchArgsError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  let configResult;
  try {
    configResult = loadConfig();
  } catch (error) {
    handleConfigError(error);
  }

  const { loaded } = configResult!;
  const branches = loaded.config?.branches;

  if (parsed.mode === "validate") {
    if (!branches) {
      console.log("No branch naming rules in .gc.json — validation skipped.");
      process.exit(0);
    }

    const result = validateBranchName(parsed.name, branches);
    printValidationResult(parsed.name, result.valid, result.valid ? undefined : result.reason);
    process.exit(result.valid ? 0 : 1);
  }

  if (parsed.mode === "create") {
    if (!branches) {
      runGitBranch(parsed.name);
      return;
    }

    const result = validateBranchName(parsed.name, branches);
    if (!result.valid) {
      console.error(result.reason);
      process.exit(1);
    }

    runGitBranch(parsed.name);
    return;
  }

  if (!branches) {
    console.log(
      "No branch naming rules in .gc.json. Run `gcv init` and enable branch conventions.",
    );
    process.exit(0);
  }

  try {
    const { name } = await runBranchPrompt(branches);
    runGitBranch(name);
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      process.exit(0);
    }
    throw error;
  }
}
