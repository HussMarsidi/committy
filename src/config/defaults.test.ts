import { describe, expect, it } from "vitest";
import {
  createDefaultBranchConfig,
  DEFAULT_BRANCH_PATTERNS,
  DEFAULT_BRANCH_TYPES,
} from "./defaults.js";

describe("branch defaults", () => {
  it("createDefaultBranchConfig returns correct shape", () => {
    expect(createDefaultBranchConfig()).toEqual({
      allowed: [...DEFAULT_BRANCH_PATTERNS],
      types: [...DEFAULT_BRANCH_TYPES],
    });
  });

  it("exports DEFAULT_BRANCH_TYPES and DEFAULT_BRANCH_PATTERNS", () => {
    expect(DEFAULT_BRANCH_TYPES).toContain("feat");
    expect(DEFAULT_BRANCH_PATTERNS).toContain("{type}/{description}");
  });
});
