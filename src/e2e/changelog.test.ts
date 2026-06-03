import { afterEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupTemps,
  run,
  tempNonRepoDir,
  tempReleaseRepo,
  tempRepoAtTag,
  tempRepoWithRemoteOnlyTags,
} from "./helpers.js";

afterEach(() => cleanupTemps());

describe("gcv changelog", () => {
  it("writes CHANGELOG.md and prints confirmation", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Changelog written to CHANGELOG.md");
    const changelogPath = join(dir, "CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(true);
    const content = readFileSync(changelogPath, "utf8");
    expect(content).toContain("Unreleased");
    expect(content).toMatch(/feat/i);
  });

  it("--from includes only commits after the given tag", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(
      ["changelog", "--dry-run", "--from", "v0.1.0"],
      dir,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).toMatch(/feat/i);
  });

  it("--dry-run prints markdown to stdout without writing a file", async () => {
    const dir = tempReleaseRepo();
    const changelogPath = join(dir, "CHANGELOG.md");
    const { exitCode, stdout } = await run(["changelog", "--dry-run"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).not.toContain("Changelog written to CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(false);
  });

  it("--all overwrites CHANGELOG.md with full history", async () => {
    const dir = tempReleaseRepo();
    const { exitCode } = await run(["changelog", "--all"], dir);
    expect(exitCode).toBe(0);

    const first = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    writeFileSync(join(dir, "CHANGELOG.md"), "# placeholder\n");

    const second = await run(["changelog", "--all"], dir);
    expect(second.exitCode).toBe(0);
    const content = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    expect(content).not.toBe("# placeholder\n");
    expect(content).toContain("0.1.0");
  });

  it("does not duplicate Unreleased when run twice without a new tag", async () => {
    const dir = tempReleaseRepo();
    const first = await run(["changelog"], dir);
    expect(first.exitCode).toBe(0);

    const second = await run(["changelog"], dir);
    expect(second.exitCode).toBe(0);

    const content = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    const unreleasedCount = (content.match(/^## (?:\[Unreleased\]|Unreleased\b)/gm) ?? [])
      .length;
    expect(unreleasedCount).toBe(1);
  });

  it("at latest tag still writes CHANGELOG.md with an Unreleased section", async () => {
    const dir = tempRepoAtTag();
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Changelog written to CHANGELOG.md");
    const content = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    expect(content).toContain("Unreleased");
  });

  it("exits 1 outside a git repository", async () => {
    const dir = tempNonRepoDir();
    const { exitCode, stderr } = await run(["changelog"], dir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Not a git repository.");
  });

  it("help lists changelog command and flags", async () => {
    const { exitCode, stdout } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("gcv changelog");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--from");
    expect(stdout).toContain("--all");
  });
});

describe("gcv changelog — non-greenfield repo", () => {
  it("fetches remote tags and shows fetch message", async () => {
    const dir = tempRepoWithRemoteOnlyTags();
    const { exitCode, stdout } = await run(["changelog", "--dry-run"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Fetching remote tags (this may take a moment)...");
  });

  it("generates changelog only from commits after the remote tag, not full history", async () => {
    const dir = tempRepoWithRemoteOnlyTags();
    const { exitCode, stdout } = await run(["changelog", "--dry-run"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).toMatch(/feat/i);
    // Pre-tag commit should not appear — confirms range starts from fetched tag
    expect(stdout).not.toContain("initial release");
  });

  it("does not crash when repo has no remote configured", async () => {
    const dir = tempReleaseRepo();
    const { exitCode } = await run(["changelog", "--dry-run"], dir);

    expect(exitCode).toBe(0);
  });
});
