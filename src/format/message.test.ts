import { describe, expect, it } from "vitest";
import { formatCommitMessage } from "./message.js";

describe("formatCommitMessage", () => {
  it("formats without scope", () => {
    expect(
      formatCommitMessage({ type: "feat", message: "add login" }),
    ).toBe("feat: add login");
  });

  it("formats with scope", () => {
    expect(
      formatCommitMessage({ type: "feat", scope: "auth", message: "add login" }),
    ).toBe("feat(auth): add login");
  });

  it("formats with team prefix", () => {
    expect(
      formatCommitMessage({
        type: "feat",
        scope: "auth",
        message: "add login",
        teamPrefix: "PCUST",
      }),
    ).toBe("feat(auth): PCUST add login");
  });
});
