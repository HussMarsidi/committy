import { describe, expect, it } from "vitest";
import { buildConfigIndexes } from "./indexes.js";

describe("buildConfigIndexes", () => {
  it("builds O(1) lookup sets and team map", () => {
    const indexes = buildConfigIndexes({
      types: ["feat", "fix"],
      scopes: [
        { name: "auth", team: "PCUST" },
        { name: "deps" },
      ],
    });

    expect(indexes.typeSet.has("feat")).toBe(true);
    expect(indexes.scopeSet.has("auth")).toBe(true);
    expect(indexes.scopeTeamMap.get("auth")).toBe("PCUST");
    expect(indexes.scopeTeamMap.has("deps")).toBe(false);
  });
});
