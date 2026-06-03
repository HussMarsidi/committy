import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

import { execFileSync, execSync } from "node:child_process";
import {
  gitAdd,
  gitCommit,
  gitTag,
  isGitRepo,
  isWorkingTreeDirty,
} from "./git.js";

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

describe("isWorkingTreeDirty", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
  });

  it("returns true when porcelain output is non-empty", () => {
    vi.mocked(execSync).mockReturnValue(" M file.ts");
    expect(isWorkingTreeDirty()).toBe(true);
  });

  it("returns false when porcelain output is empty", () => {
    vi.mocked(execSync).mockReturnValue("");
    expect(isWorkingTreeDirty()).toBe(false);
  });
});

describe("gitAdd", () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockReset();
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));
  });

  it("stages listed files", () => {
    gitAdd(["CHANGELOG.md", "package.json"]);
    expect(execFileSync).toHaveBeenCalledWith("git", ["add", "CHANGELOG.md", "package.json"], {
      stdio: "pipe",
    });
  });
});

describe("gitCommit", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));
  });

  it("creates release commit with version in message", () => {
    gitCommit("1.3.0");
    expect(execSync).toHaveBeenCalledWith('git commit -m "chore(release): v1.3.0"', {
      stdio: "pipe",
    });
  });
});

describe("gitTag", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));
  });

  it("creates lightweight v-prefixed tag", () => {
    gitTag("1.3.0");
    expect(execSync).toHaveBeenCalledWith("git tag v1.3.0", { stdio: "pipe" });
  });
});
