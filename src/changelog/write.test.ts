import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "node:fs/promises";
import { stripLeadingUnreleasedSection, writeChangelog } from "./write.js";

describe("stripLeadingUnreleasedSection", () => {
  it("removes a leading Unreleased block", () => {
    const input = "## Unreleased\n\n### Features\n\n* foo\n\n## 1.0.0\n";
    expect(stripLeadingUnreleasedSection(input)).toBe("## 1.0.0\n");
  });

  it("removes a leading bracketed Unreleased block", () => {
    const input = "## [Unreleased](compare/link) (2026-01-01)\n\n* bar\n\n## 1.0.0\n";
    expect(stripLeadingUnreleasedSection(input)).toBe("## 1.0.0\n");
  });

  it("returns content unchanged when Unreleased is not first", () => {
    const input = "## 1.0.0\n\n## Unreleased\n";
    expect(stripLeadingUnreleasedSection(input)).toBe(input);
  });
});

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

  it("replaces an existing Unreleased section instead of duplicating it", async () => {
    vi.mocked(readFile).mockResolvedValue(
      "## Unreleased\n\n* old feat\n\n## 1.0.0\n\n* shipped\n",
    );

    await writeChangelog({
      content: "## Unreleased\n\n* new feat",
      dryRun: false,
      all: false,
      filePath: "/tmp/CHANGELOG.md",
    });

    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/CHANGELOG.md",
      "## Unreleased\n\n* new feat\n## 1.0.0\n\n* shipped\n",
    );
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
