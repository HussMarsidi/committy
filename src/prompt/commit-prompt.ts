import { confirm, input, select } from "@inquirer/prompts";
import type { GcScope } from "../config/types.js";
import {
  buildEmptyPromptState,
  buildPromptStateFromParsed,
  type CommitPromptState,
} from "./fields.js";
import type { ParsedInline } from "../parse/types.js";

export class PromptCancelledError extends Error {
  constructor() {
    super("Prompt cancelled");
    this.name = "PromptCancelledError";
  }
}

function isCancelError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "ExitPromptError" || error.message.includes("force closed"))
  );
}

export type PromptResult = {
  type: string;
  scope?: string;
  message: string;
};

async function promptType(
  state: CommitPromptState,
  effectiveTypes: string[],
): Promise<string> {
  if (state.type.locked && state.type.value) {
    console.log(`Type: ${state.type.value}`);
    return state.type.value;
  }

  const message = state.type.invalid
    ? `Type (invalid: "${state.type.invalid}")`
    : "Type";

  return select({
    message,
    choices: effectiveTypes.map((t) => ({ name: t, value: t })),
    pageSize: 12,
  });
}

async function promptScope(
  state: CommitPromptState,
  effectiveScopes: GcScope[],
  hasConfig: boolean,
): Promise<string | undefined> {
  if (state.scope.locked) {
    if (state.scope.value) {
      console.log(`Scope: ${state.scope.value}`);
    }
    return state.scope.value;
  }

  if (state.scope.invalid) {
    const value = await input({
      message: `Scope (invalid: "${state.scope.invalid}")`,
    });
    return value.trim() || undefined;
  }

  if (hasConfig && effectiveScopes.length > 0) {
    const choices = [
      { name: "(none)", value: "" },
      ...effectiveScopes.map((s) => ({
        name: s.team ? `${s.name} (${s.team})` : s.name,
        value: s.name,
      })),
    ];

    const selected = await select({
      message: "Scope (optional)",
      choices,
    });

    return selected || undefined;
  }

  const value = await input({
    message: "Scope (optional, press Enter to skip)",
  });
  return value.trim() || undefined;
}

async function promptMessage(state: CommitPromptState): Promise<string> {
  if (state.message.locked && state.message.value) {
    console.log(`Message: ${state.message.value}`);
    return state.message.value;
  }

  let message = "";
  while (!message.trim()) {
    message = await input({ message: "Message" });
    message = message.trim();
    if (!message) {
      console.log("Message is required.");
    }
  }
  return message;
}

export async function runCommitPrompt(options: {
  parsed?: ParsedInline;
  effectiveTypes: string[];
  effectiveScopes: GcScope[];
  hasConfig: boolean;
}): Promise<PromptResult> {
  const state = options.parsed
    ? buildPromptStateFromParsed(options.parsed, options.hasConfig)
    : buildEmptyPromptState();

  try {
    let type: string;
    if (state.type.locked && state.type.value) {
      console.log(`Type: ${state.type.value}`);
      type = state.type.value;
    } else {
      type = await promptType(state, options.effectiveTypes);
    }

    let scope: string | undefined;
    if (state.scope.locked) {
      if (state.scope.value) {
        console.log(`Scope: ${state.scope.value}`);
      }
      scope = state.scope.value;
    } else {
      scope = await promptScope(state, options.effectiveScopes, options.hasConfig);
    }

    let message: string;
    if (state.message.locked && state.message.value) {
      console.log(`Message: ${state.message.value}`);
      message = state.message.value;
    } else {
      message = await promptMessage(state);
    }

    return { type, scope, message };
  } catch (error) {
    if (isCancelError(error)) {
      throw new PromptCancelledError();
    }
    throw error;
  }
}

export async function promptConfirm(message: string): Promise<boolean> {
  try {
    return confirm({ message, default: false });
  } catch (error) {
    if (isCancelError(error)) {
      throw new PromptCancelledError();
    }
    throw error;
  }
}

export async function promptInput(message: string): Promise<string> {
  try {
    return input({ message });
  } catch (error) {
    if (isCancelError(error)) {
      throw new PromptCancelledError();
    }
    throw error;
  }
}

export async function promptSelect<T extends string>(
  message: string,
  choices: { name: string; value: T }[],
): Promise<T> {
  try {
    return select({ message, choices });
  } catch (error) {
    if (isCancelError(error)) {
      throw new PromptCancelledError();
    }
    throw error;
  }
}
