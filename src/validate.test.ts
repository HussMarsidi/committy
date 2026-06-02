import { describe, expect, it } from "vitest";
import { buildConfigIndexes } from "./config/indexes.js";
import { getTeamPrefix, isValidScope, isValidType } from "./validate.js";

const indexes = buildConfigIndexes({
  types: ["feat", "fix"],
  scopes: [{ name: "auth", team: "PCUST" }],
});

describe("isValidType", () => {
  it("returns true without config", () => {
    expect(isValidType("anything", indexes, false)).toBe(true);
  });

  it("checks typeSet with config", () => {
    expect(isValidType("feat", indexes, true)).toBe(true);
    expect(isValidType("bogus", indexes, true)).toBe(false);
  });
});

describe("isValidScope", () => {
  it("returns true without config", () => {
    expect(isValidScope("anything", indexes, false)).toBe(true);
  });

  it("checks scopeSet with config", () => {
    expect(isValidScope("auth", indexes, true)).toBe(true);
    expect(isValidScope("readme", indexes, true)).toBe(false);
  });
});

describe("getTeamPrefix", () => {
  it("returns team when scope has one", () => {
    expect(getTeamPrefix("auth", indexes.scopeTeamMap)).toBe("PCUST");
  });

  it("returns undefined without scope or team", () => {
    expect(getTeamPrefix(undefined, indexes.scopeTeamMap)).toBeUndefined();
    expect(getTeamPrefix("deps", indexes.scopeTeamMap)).toBeUndefined();
  });
});
