import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "node:fs/promises";
import {
  stripLeadingUnreleasedSection,
  writeChangelogFile,
  writeReleaseChangelog,
} from "./write.js";

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

describe("writeReleaseChangelog", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy.mockClear();
  });

  it("prepends to existing file", async () => {
    vi.mocked(readFile).mockResolvedValue("## Old\n");

    await writeReleaseChangelog("## New", "/tmp/CHANGELOG.md");

    expect(readFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "utf8");
    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## New\n## Old\n");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("replaces an existing Unreleased section instead of duplicating it", async () => {
    vi.mocked(readFile).mockResolvedValue(
      "## Unreleased\n\n* old feat\n\n## 1.0.0\n\n* shipped\n",
    );

    await writeReleaseChangelog("## Unreleased\n\n* new feat", "/tmp/CHANGELOG.md");

    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/CHANGELOG.md",
      "## Unreleased\n\n* new feat\n## 1.0.0\n\n* shipped\n",
    );
  });

  it("creates file when missing", async () => {
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    vi.mocked(readFile).mockRejectedValue(enoent);

    await writeReleaseChangelog("## New", "/tmp/CHANGELOG.md");

    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## New");
  });
});

describe("writeChangelogFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes content without logging", async () => {
    await writeChangelogFile("## Full\n", "/tmp/CHANGELOG.md");

    expect(writeFile).toHaveBeenCalledWith("/tmp/CHANGELOG.md", "## Full\n");
  });
});
