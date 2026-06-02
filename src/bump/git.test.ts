import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "node:child_process";
import { isGitRepo } from "./git.js";

describe("isGitRepo", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
  });

  it("returns true when git rev-parse succeeds", () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(".git"));
    expect(isGitRepo()).toBe(true);
    expect(execSync).toHaveBeenCalledWith("git rev-parse --git-dir", {
      stdio: "pipe",
    });
  });

  it("returns false when git rev-parse throws", () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("not a repo");
    });
    expect(isGitRepo()).toBe(false);
  });
});
