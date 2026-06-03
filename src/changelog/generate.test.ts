import { beforeEach, describe, expect, it, vi } from "vitest";

const loadPreset = vi.fn();
const context = vi.fn();
const options = vi.fn();
const commits = vi.fn();
const write = vi.fn();
const readPackage = vi.fn();
const readRepository = vi.fn();

const ConventionalChangelogMock = vi.fn().mockImplementation(() => ({
  loadPreset,
  context,
  options,
  commits,
  write,
  readPackage,
  readRepository,
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
    readPackage.mockReturnThis();
    readRepository.mockReturnThis();
  });

  it("loads preset, sets Unreleased context and releaseCount 1 by default", async () => {
    write.mockReturnValue(createWriteGenerator(["# changelog\n"]));

    const result = await generateChangelog({
      from: null,
      init: false,
    });

    expect(loadPreset).toHaveBeenCalledWith("conventionalcommits");
    expect(readPackage).toHaveBeenCalled();
    expect(options).toHaveBeenCalledWith({ releaseCount: 1 });
    expect(context).toHaveBeenCalledWith({ version: "Unreleased" });
    expect(commits).not.toHaveBeenCalled();
    expect(result).toBe("# changelog\n");
  });

  it("passes explicit version to context and releaseCount 1", async () => {
    write.mockReturnValue(createWriteGenerator(["release\n"]));

    await generateChangelog({
      version: "1.3.0",
      from: null,
      init: false,
    });

    expect(options).toHaveBeenCalledWith({ releaseCount: 1 });
    expect(context).toHaveBeenCalledWith({ version: "1.3.0" });
  });

  it("calls options with releaseCount 0 and skips context when init is true", async () => {
    write.mockReturnValue(createWriteGenerator(["full\n"]));

    await generateChangelog({
      from: null,
      init: true,
    });

    expect(options).toHaveBeenCalledWith({ releaseCount: 0 });
    expect(context).not.toHaveBeenCalled();
    expect(commits).not.toHaveBeenCalled();
  });

  it("calls commits when from is set", async () => {
    write.mockReturnValue(createWriteGenerator(["partial\n"]));

    await generateChangelog({
      from: "v1.0.0",
      init: false,
    });

    expect(commits).toHaveBeenCalledWith({ from: "v1.0.0" });
    expect(options).not.toHaveBeenCalled();
  });

  it("does not call commits when init and from are both set", async () => {
    write.mockReturnValue(createWriteGenerator(["full\n"]));

    await generateChangelog({
      from: "v1.0.0",
      init: true,
    });

    expect(options).toHaveBeenCalledWith({ releaseCount: 0 });
    expect(context).not.toHaveBeenCalled();
    expect(commits).not.toHaveBeenCalled();
  });

  it("rejects when write generator throws", async () => {
    write.mockReturnValue(
      (async function* () {
        throw new Error("write failed");
      })(),
    );

    await expect(generateChangelog({ from: null, init: false })).rejects.toThrow("write failed");
  });

  it("returns empty string when write yields nothing", async () => {
    write.mockReturnValue(createWriteGenerator([]));

    const result = await generateChangelog({
      from: null,
      init: false,
    });

    expect(result).toBe("");
  });
});
