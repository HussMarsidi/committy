import type { GcBranchConfig } from "../config/types.js";
import {
  PromptCancelledError,
  promptInput,
  promptSelect,
} from "../prompt/commit-prompt.js";
import { validateBranchName } from "./validate.js";
import { extractSegments } from "./template.js";

export type BranchPromptResult = {
  name: string;
};

function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function promptSegment(
  segment: string,
  config: GcBranchConfig,
): Promise<string> {
  switch (segment) {
    case "type":
      return promptSelect("Branch type", config.types.map((t) => ({ name: t, value: t })));
    case "ticket":
      return promptInput("Ticket (e.g. PROJ-123)");
    case "description": {
      const raw = await promptInput("Description (kebab-case)");
      return toKebabCase(raw);
    }
    default:
      return promptInput(segment);
  }
}

function substitutePattern(pattern: string, values: Record<string, string>): string {
  return pattern.replace(/\{([^}]+)\}/g, (_, name: string) => values[name] ?? "");
}

async function buildFromPattern(
  pattern: string,
  config: GcBranchConfig,
): Promise<string> {
  const segments = extractSegments(pattern);
  const values: Record<string, string> = {};

  for (const segment of segments) {
    values[segment] = await promptSegment(segment, config);
  }

  return substitutePattern(pattern, values);
}

async function choosePattern(config: GcBranchConfig): Promise<string> {
  if (config.allowed.length === 1) {
    return config.allowed[0];
  }

  return promptSelect(
    "Branch pattern",
    config.allowed.map((pattern) => ({ name: pattern, value: pattern })),
  );
}

export async function runBranchPrompt(config: GcBranchConfig): Promise<BranchPromptResult> {
  while (true) {
    const pattern = await choosePattern(config);
    const name = await buildFromPattern(pattern, config);
    const result = validateBranchName(name, config);

    if (result.valid) {
      return { name };
    }

    console.log(result.reason);
    console.log("Try again.");
  }
}
