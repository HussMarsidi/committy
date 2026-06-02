import { describe, expect, it } from "vitest";
import { validateBranchName } from "./validate.js";

const config = {
  allowed: ["{type}/{description}", "{type}/{ticket}-{description}"],
  types: ["feat", "fix"],
};

describe("validateBranchName", () => {
  it("accepts name matching first pattern", () => {
    expect(validateBranchName("feat/add-login", config)).toEqual({ valid: true });
  });

  it("accepts name matching second pattern", () => {
    expect(validateBranchName("fix/PROJ-42-handle-auth", config)).toEqual({ valid: true });
  });

  it("rejects name matching no pattern", () => {
    const result = validateBranchName("wip/add-login", config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("does not match");
    }
  });

  it("rejects empty allowed patterns", () => {
    const result = validateBranchName("feat/foo", { allowed: [], types: ["feat"] });
    expect(result).toEqual({ valid: false, reason: "No branch patterns configured." });
  });

  it("rejects empty branch name", () => {
    expect(validateBranchName("", config).valid).toBe(false);
    expect(validateBranchName("   ", config).valid).toBe(false);
  });

  it("rejects uppercase in description segment", () => {
    expect(validateBranchName("feat/Add-Login", config).valid).toBe(false);
  });
});
