import { describe, expect, it } from "vitest";
import { buildPromptStateFromParsed } from "./fields.js";

describe("buildPromptStateFromParsed", () => {
  it("locks valid type on invalid scope fallback", () => {
    const state = buildPromptStateFromParsed(
      {
        type: "fix",
        scope: "unknown",
        message: "msg",
        mode: "partial",
        partialReason: "invalid-scope",
      },
      true,
    );

    expect(state.type.locked).toBe(true);
    expect(state.scope.locked).toBe(false);
    expect(state.scope.invalid).toBe("unknown");
    expect(state.focus).toBe("scope");
  });

  it("focuses type when missing on 1-arg input", () => {
    const state = buildPromptStateFromParsed(
      {
        message: "fix svg",
        mode: "partial",
        partialReason: "missing-message",
      },
      true,
    );

    expect(state.type.locked).toBe(false);
    expect(state.message.value).toBe("fix svg");
    expect(state.message.locked).toBe(false);
    expect(state.focus).toBe("type");
  });

  it("locks type and scope when scope matched but message missing", () => {
    const state = buildPromptStateFromParsed(
      {
        type: "fix",
        scope: "auth",
        mode: "partial",
        partialReason: "missing-message",
      },
      true,
    );

    expect(state.type.locked).toBe(true);
    expect(state.scope.locked).toBe(true);
    expect(state.focus).toBe("message");
  });
});
