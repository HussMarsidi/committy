import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "node:fs/promises";
import { writeChangelog } from "./write.js";

describe("writeChangelog", () => {
  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy.mockClear();
    logSpy.mockClear();
  });

  it("writes to stdout on dry run without touching file", async () => {
    await writeChangelog({
      content: "## Unreleased\n",
      dryRun: true,
      all: false,
      filePath: "/tmp/CHANGELOG.md",
    });

    expect(stdoutSpy).toHaveBeenCalledWith("## Unreleased\n");
    expect(writeFile).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("overwrites file when all is true", async () => {
    await writeChangelog({
      content: "## Full\n",
      dryRun: false,
      all: true,
      filePath: "/tmp/CHANGELOG.md",
    });

    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## Full\n");
    expect(logSpy).toHaveBeenCalledWith("Changelog written to CHANGELOG.md");
  });

  it("prepends to existing file by default", async () => {
    vi.mocked(readFile).mockResolvedValue("## Old\n");

    await writeChangelog({
      content: "## New",
      dryRun: false,
      all: false,
      filePath: "/tmp/CHANGELOG.md",
    });

    expect(readFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "utf8");
    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## New\n## Old\n");
  });

  it("creates file when missing", async () => {
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    vi.mocked(readFile).mockRejectedValue(enoent);

    await writeChangelog({
      content: "## New",
      dryRun: false,
      all: false,
      filePath: "/tmp/CHANGELOG.md",
    });

    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## New");
  });
});
