import type { GcConfig } from "./types.js";

export const DEFAULT_TYPES = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
  "style",
  "perf",
  "ci",
  "build",
  "revert",
] as const;

export function createDefaultConfig(): GcConfig {
  return {
    types: [...DEFAULT_TYPES],
    scopes: [],
  };
}
