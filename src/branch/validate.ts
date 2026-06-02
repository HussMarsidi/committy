import type { GcBranchConfig } from "../config/types.js";
import { compilePattern } from "./template.js";

export type BranchValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateBranchName(
  name: string,
  config: GcBranchConfig,
): BranchValidationResult {
  if (!name.trim()) {
    return { valid: false, reason: "Branch name is required." };
  }

  if (config.allowed.length === 0) {
    return { valid: false, reason: "No branch patterns configured." };
  }

  if (config.types.length === 0) {
    return { valid: false, reason: "No branch types configured." };
  }

  for (const pattern of config.allowed) {
    const regex = compilePattern(pattern, config.types);
    if (regex.test(name)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    reason: `Branch name does not match any allowed pattern. Tried: ${config.allowed.join(", ")}`,
  };
}
