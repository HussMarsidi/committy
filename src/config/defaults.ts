import type { GcBranchConfig, GcConfig } from "./types.js";

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

export const DEFAULT_BRANCH_TYPES = [
  "feat",
  "fix",
  "hotfix",
  "release",
  "chore",
] as const;

export const DEFAULT_BRANCH_PATTERNS = [
  "{type}/{description}",
  "{type}/{ticket}-{description}",
] as const;

export function createDefaultBranchConfig(): GcBranchConfig {
  return {
    allowed: [...DEFAULT_BRANCH_PATTERNS],
    types: [...DEFAULT_BRANCH_TYPES],
  };
}

export function createDefaultConfig(): GcConfig {
  return {
    types: [...DEFAULT_TYPES],
    scopes: [],
  };
}
