import { describe, expect, it } from "vitest";
import { BranchArgsError, parseBranchArgs } from "./inline.js";

describe("parseBranchArgs", () => {
  it("returns interactive for empty args", () => {
    expect(parseBranchArgs([])).toEqual({ mode: "interactive" });
  });

  it("returns create for a single branch name", () => {
    expect(parseBranchArgs(["feat/add-login"])).toEqual({
      mode: "create",
      name: "feat/add-login",
    });
  });

  it("returns validate mode with name", () => {
    expect(parseBranchArgs(["validate", "feat/add-login"])).toEqual({
      mode: "validate",
      name: "feat/add-login",
    });
  });

  it("throws when validate has no branch name", () => {
    expect(() => parseBranchArgs(["validate"])).toThrow(BranchArgsError);
  });
});
