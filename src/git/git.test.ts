import { execSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { runGitBranch } from "./branch.js";
import { runGitCommit } from "./commit.js";
import { hasStagedFiles } from "./staged.js";

describe("hasStagedFiles", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
  });

  it("returns false when nothing is staged", () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    expect(hasStagedFiles()).toBe(false);
    expect(execSync).toHaveBeenCalledWith("git diff --cached --quiet", {
      stdio: "pipe",
    });
  });

  it("returns true when staged diff exists", () => {
    vi.mocked(execSync).mockImplementation(() => {
      const err = new Error("staged") as Error & { status: number };
      err.status = 1;
      throw err;
    });
    expect(hasStagedFiles()).toBe(true);
  });
});

describe("runGitBranch", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));
  });

  it("runs git switch -c with quoted branch name", () => {
    runGitBranch("feat/add-login");
    expect(execSync).toHaveBeenCalledWith('git switch -c "feat/add-login"', {
      stdio: "inherit",
    });
  });
});

describe("runGitCommit", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));
  });

  it("quotes message with JSON.stringify", () => {
    runGitCommit('fix: say "hello"');
    expect(execSync).toHaveBeenCalledWith('git commit -m "fix: say \\"hello\\""', {
      stdio: "inherit",
    });
  });

  it("handles messages with newlines safely", () => {
    runGitCommit("fix: line\nbreak");
    expect(execSync).toHaveBeenCalledWith('git commit -m "fix: line\\nbreak"', {
      stdio: "inherit",
    });
  });
});
