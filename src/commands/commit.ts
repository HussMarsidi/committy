import { ConfigError } from "../config/types.js";
import { loadConfig } from "../config/loader.js";
import { formatCommitMessage } from "../format/message.js";
import { runGitCommit } from "../git/commit.js";
import { hasStagedFiles } from "../git/staged.js";
import { parseInlineArgs } from "../parse/inline.js";
import { PromptCancelledError, runCommitPrompt } from "../prompt/commit-prompt.js";
import { getTeamPrefix } from "../validate.js";

function guardStagedFiles(): void {
  if (!hasStagedFiles()) {
    console.log("Nothing staged. Run `git add` first.");
    process.exit(0);
  }
}

function handleConfigError(error: unknown): never {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

export async function runCommitCommand(inlineArgs: string[]): Promise<void> {
  guardStagedFiles();

  let configResult;
  try {
    configResult = loadConfig();
  } catch (error) {
    handleConfigError(error);
  }

  const { loaded, indexes, effectiveTypes, effectiveScopes } = configResult!;
  const hasConfig = loaded.config !== null;

  if (inlineArgs.length === 0) {
    try {
      const result = await runCommitPrompt({
        effectiveTypes,
        effectiveScopes,
        hasConfig,
      });
      const teamPrefix = getTeamPrefix(result.scope, indexes.scopeTeamMap);
      const message = formatCommitMessage({ ...result, teamPrefix });
      runGitCommit(message);
    } catch (error) {
      if (error instanceof PromptCancelledError) {
        process.exit(0);
      }
      throw error;
    }
    return;
  }

  const parsed = parseInlineArgs(inlineArgs, indexes, hasConfig);

  if (parsed.mode === "complete" && parsed.type && parsed.message) {
    const teamPrefix = getTeamPrefix(parsed.scope, indexes.scopeTeamMap);
    const message = formatCommitMessage({
      type: parsed.type,
      scope: parsed.scope,
      message: parsed.message,
      teamPrefix,
    });
    runGitCommit(message);
    return;
  }

  try {
    const result = await runCommitPrompt({
      parsed,
      effectiveTypes,
      effectiveScopes,
      hasConfig,
    });
    const teamPrefix = getTeamPrefix(result.scope, indexes.scopeTeamMap);
    const message = formatCommitMessage({ ...result, teamPrefix });
    runGitCommit(message);
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      process.exit(0);
    }
    throw error;
  }
}
