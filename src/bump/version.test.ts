import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  hasPackageJson,
  nextVersion,
  readCurrentVersion,
  writePackageVersion,
} from "./version.js";

describe("hasPackageJson", () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
  });

  it("returns true when package.json exists", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    expect(hasPackageJson()).toBe(true);
  });
});

describe("readCurrentVersion", () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
    vi.mocked(readFileSync).mockReset();
    vi.mocked(execSync).mockReset();
  });

  it("reads version from package.json", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "1.2.3" }));

    expect(readCurrentVersion()).toBe("1.2.3");
  });

  it("falls back to git tags when package.json is missing", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(execSync).mockReturnValue("v2.0.0\nv1.0.0\n");

    expect(readCurrentVersion()).toBe("2.0.0");
  });

  it("falls back to git tags when package.json has no version", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ name: "app" }));
    vi.mocked(execSync).mockReturnValue("v1.5.0\n");

    expect(readCurrentVersion()).toBe("1.5.0");
  });

  it("throws when neither source is available", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(execSync).mockReturnValue("not-a-tag\n");

    expect(() => readCurrentVersion()).toThrow(
      "Could not determine current version",
    );
  });
});

describe("nextVersion", () => {
  it("increments patch", () => {
    expect(nextVersion("1.2.0", "patch")).toBe("1.2.1");
  });

  it("increments minor", () => {
    expect(nextVersion("1.2.0", "minor")).toBe("1.3.0");
  });

  it("increments major", () => {
    expect(nextVersion("1.2.0", "major")).toBe("2.0.0");
  });

  it("increments major from 0.x", () => {
    expect(nextVersion("0.2.0", "major")).toBe("1.0.0");
  });

  it("throws on invalid version", () => {
    expect(() => nextVersion("not-semver", "patch")).toThrow(
      "Invalid current version: not-semver",
    );
  });
});

describe("writePackageVersion", () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
    vi.mocked(readFileSync).mockReset();
    vi.mocked(writeFileSync).mockReset();
  });

  it("updates version and preserves trailing newline", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      `${JSON.stringify({ name: "app", version: "1.0.0" }, null, 2)}\n`,
    );

    writePackageVersion("1.1.0");

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      `${JSON.stringify({ name: "app", version: "1.1.0" }, null, 2)}\n`,
    );
  });

  it("no-ops when package.json does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);

    writePackageVersion("2.0.0");

    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
