import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseChangelogArgs } from "./args.js";

describe("parseChangelogArgs", () => {
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
    expect(parseChangelogArgs([])).toEqual({
      dryRun: false,
      from: null,
      all: false,
    });
  });

  it("parses --dry-run", () => {
    expect(parseChangelogArgs(["--dry-run"])).toEqual({
      dryRun: true,
      from: null,
      all: false,
    });
  });

  it("parses --from with value", () => {
    expect(parseChangelogArgs(["--from", "v1.0.0"])).toEqual({
      dryRun: false,
      from: "v1.0.0",
      all: false,
    });
  });

  it("parses --all", () => {
    expect(parseChangelogArgs(["--all"])).toEqual({
      dryRun: false,
      from: null,
      all: true,
    });
  });

  it("--all wins over --from", () => {
    expect(parseChangelogArgs(["--all", "--from", "v1.0.0"])).toEqual({
      dryRun: false,
      from: null,
      all: true,
    });
  });

  it("combines --dry-run and --all", () => {
    expect(parseChangelogArgs(["--dry-run", "--all"])).toEqual({
      dryRun: true,
      from: null,
      all: true,
    });
  });

  it("exits when --from has no value", () => {
    expect(() => parseChangelogArgs(["--from"])).toThrow(/process\.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on unknown flag", () => {
    expect(() => parseChangelogArgs(["--unknown"])).toThrow(/process\.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
