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
      from: null,
    });
  });

  it("parses --from with value", () => {
    expect(parseChangelogArgs(["--from", "v1.0.0"])).toEqual({
      from: "v1.0.0",
    });
  });

  it("rejects --dry-run", () => {
    expect(() => parseChangelogArgs(["--dry-run"])).toThrow(/process\.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("always prints to stdout"),
    );
  });

  it("rejects --init and --all", () => {
    expect(() => parseChangelogArgs(["--init"])).toThrow(/process\.exit/);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("preview-only"));

    errorSpy.mockClear();
    expect(() => parseChangelogArgs(["--all"])).toThrow(/process\.exit/);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("preview-only"));
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
