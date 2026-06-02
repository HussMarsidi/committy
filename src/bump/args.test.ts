import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseBumpArgs } from "./args.js";

describe("parseBumpArgs", () => {
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    exitSpy.mockClear();
    errorSpy.mockClear();
  });

  afterEach(() => {
    exitSpy.mockReset();
    errorSpy.mockReset();
  });

  it("returns defaults for empty args", () => {
    expect(parseBumpArgs([])).toEqual({
      override: null,
      dryRun: false,
      noTag: false,
    });
  });

  it("parses --minor", () => {
    expect(parseBumpArgs(["--minor"])).toEqual({
      override: "minor",
      dryRun: false,
      noTag: false,
    });
  });

  it("parses --major", () => {
    expect(parseBumpArgs(["--major"])).toEqual({
      override: "major",
      dryRun: false,
      noTag: false,
    });
  });

  it("parses --patch", () => {
    expect(parseBumpArgs(["--patch"])).toEqual({
      override: "patch",
      dryRun: false,
      noTag: false,
    });
  });

  it("parses --dry-run", () => {
    expect(parseBumpArgs(["--dry-run"])).toEqual({
      override: null,
      dryRun: true,
      noTag: false,
    });
  });

  it("parses --no-tag", () => {
    expect(parseBumpArgs(["--no-tag"])).toEqual({
      override: null,
      dryRun: false,
      noTag: true,
    });
  });

  it("combines flags", () => {
    expect(parseBumpArgs(["--minor", "--dry-run", "--no-tag"])).toEqual({
      override: "minor",
      dryRun: true,
      noTag: true,
    });
  });

  it("exits when multiple override flags are given", () => {
    expect(() => parseBumpArgs(["--major", "--minor"])).toThrow(/process\.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on unknown flag", () => {
    expect(() => parseBumpArgs(["--unknown"])).toThrow(/process\.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
