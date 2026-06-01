import { describe, expect, it } from "vitest";
import { parseInlineArgs } from "./inline.js";
import { buildConfigIndexes } from "../config/indexes.js";

const indexes = buildConfigIndexes({
  types: ["feat", "fix"],
  scopes: [{ name: "auth", team: "PCUST" }],
});

describe("parseInlineArgs", () => {
  it("1 arg → message only, partial", () => {
    const result = parseInlineArgs(["fix svg"], indexes, true);
    expect(result).toEqual({
      message: "fix svg",
      mode: "partial",
      partialReason: "missing-message",
    });
  });

  it("2 args with known scope → partial missing message", () => {
    const result = parseInlineArgs(["fix", "auth"], indexes, true);
    expect(result).toEqual({
      type: "fix",
      scope: "auth",
      mode: "partial",
      partialReason: "missing-message",
    });
  });

  it("2 args with unknown token → complete type + message", () => {
    const result = parseInlineArgs(["fix", "readme"], indexes, true);
    expect(result).toEqual({
      type: "fix",
      message: "readme",
      mode: "complete",
    });
  });

  it("2 args without config → always type + message", () => {
    const result = parseInlineArgs(["fix", "auth"], indexes, false);
    expect(result).toEqual({
      type: "fix",
      message: "auth",
      mode: "complete",
    });
  });

  it("3+ args → type, scope, joined message", () => {
    const result = parseInlineArgs(
      ["feat", "auth", "fix", "svg", "images"],
      indexes,
      true,
    );
    expect(result).toEqual({
      type: "feat",
      scope: "auth",
      message: "fix svg images",
      mode: "complete",
    });
  });

  it("invalid type → partial with reason", () => {
    const result = parseInlineArgs(["bogus", "readme"], indexes, true);
    expect(result.mode).toBe("partial");
    expect(result.partialReason).toBe("invalid-type");
    expect(result.type).toBe("bogus");
  });

  it("invalid scope → partial with reason", () => {
    const result = parseInlineArgs(["fix", "unknown", "msg"], indexes, true);
    expect(result.mode).toBe("partial");
    expect(result.partialReason).toBe("invalid-scope");
    expect(result.scope).toBe("unknown");
  });
});
