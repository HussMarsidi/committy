import { beforeEach, describe, expect, it, vi } from "vitest";

const loadPreset = vi.fn();
const context = vi.fn();
const options = vi.fn();
const commits = vi.fn();
const write = vi.fn();

const ConventionalChangelogMock = vi.fn().mockImplementation(() => ({
  loadPreset,
  context,
  options,
  commits,
  write,
}));

vi.mock("conventional-changelog", () => ({
  ConventionalChangelog: ConventionalChangelogMock,
}));

import { generateChangelog } from "./generate.js";

function createWriteGenerator(chunks: string[]): AsyncGenerator<string> {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

describe("generateChangelog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadPreset.mockResolvedValue(undefined);
    context.mockResolvedValue(undefined);
    options.mockResolvedValue(undefined);
  });

  it("loads preset and sets Unreleased context by default", async () => {
    write.mockReturnValue(createWriteGenerator(["# changelog\n"]));

    const result = await generateChangelog({
      version: "Unreleased",
      from: null,
      all: false,
    });

    expect(loadPreset).toHaveBeenCalledWith("conventionalcommits");
    expect(context).toHaveBeenCalledWith({ version: "Unreleased" });
    expect(options).not.toHaveBeenCalled();
    expect(commits).not.toHaveBeenCalled();
    expect(result).toBe("# changelog\n");
  });

  it("passes explicit version to context", async () => {
    write.mockReturnValue(createWriteGenerator(["release\n"]));

    await generateChangelog({
      version: "1.3.0",
      from: null,
      all: false,
    });

    expect(context).toHaveBeenCalledWith({ version: "1.3.0" });
  });

  it("calls options with releaseCount 0 when all is true", async () => {
    write.mockReturnValue(createWriteGenerator(["full\n"]));

    await generateChangelog({
      version: "Unreleased",
      from: null,
      all: true,
    });

    expect(options).toHaveBeenCalledWith({ releaseCount: 0 });
    expect(commits).not.toHaveBeenCalled();
  });

  it("calls commits when from is set", async () => {
    write.mockReturnValue(createWriteGenerator(["partial\n"]));

    await generateChangelog({
      version: "Unreleased",
      from: "v1.0.0",
      all: false,
    });

    expect(commits).toHaveBeenCalledWith({ from: "v1.0.0" });
    expect(options).not.toHaveBeenCalled();
  });

  it("does not call commits when all and from are both set", async () => {
    write.mockReturnValue(createWriteGenerator(["full\n"]));

    await generateChangelog({
      version: "Unreleased",
      from: "v1.0.0",
      all: true,
    });

    expect(options).toHaveBeenCalledWith({ releaseCount: 0 });
    expect(commits).not.toHaveBeenCalled();
  });

  it("rejects when write generator throws", async () => {
    write.mockReturnValue(
      (async function* () {
        throw new Error("write failed");
      })(),
    );

    await expect(
      generateChangelog({ version: "Unreleased", from: null, all: false }),
    ).rejects.toThrow("write failed");
  });

  it("returns empty string when write yields nothing", async () => {
    write.mockReturnValue(createWriteGenerator([]));

    const result = await generateChangelog({
      version: "Unreleased",
      from: null,
      all: false,
    });

    expect(result).toBe("");
  });
});
