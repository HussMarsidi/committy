import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
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
  it("prints unreleased markdown to stdout without writing a file", async () => {
    const dir = tempReleaseRepo();
    const changelogPath = join(dir, "CHANGELOG.md");
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).toMatch(/feat/i);
    expect(stdout).not.toContain("Changelog written to CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(false);
  });

  it("--from includes only commits after the given tag", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["changelog", "--from", "v0.1.0"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).toMatch(/feat/i);
    expect(existsSync(join(dir, "CHANGELOG.md"))).toBe(false);
  });

  it("rejects removed --dry-run flag", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stderr } = await run(["changelog", "--dry-run"], dir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("always prints to stdout");
  });

  it("rejects --init and --all as preview-only", async () => {
    const dir = tempReleaseRepo();

    const init = await run(["changelog", "--init"], dir);
    expect(init.exitCode).toBe(1);
    expect(init.stderr).toContain("preview-only");

    const all = await run(["changelog", "--all"], dir);
    expect(all.exitCode).toBe(1);
    expect(all.stderr).toContain("preview-only");
  });

  it("at latest tag still previews Unreleased to stdout", async () => {
    const dir = tempRepoAtTag();
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(existsSync(join(dir, "CHANGELOG.md"))).toBe(false);
  });

  it("exits 1 outside a git repository", async () => {
    const dir = tempNonRepoDir();
    const { exitCode, stderr } = await run(["changelog"], dir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Not a git repository.");
  });

  it("help lists changelog as preview-only", async () => {
    const { exitCode, stdout } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("gcv changelog");
    expect(stdout).toContain("--from");
    expect(stdout).toContain("stdout only");
    expect(stdout).not.toContain("gcv changelog --dry-run");
    expect(stdout).not.toContain("--init");
    expect(stdout).not.toContain("--all");
  });
});

describe("gcv changelog — non-greenfield repo", () => {
  it("fetches remote tags and shows fetch message", async () => {
    const dir = tempRepoWithRemoteOnlyTags();
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Fetching remote tags (this may take a moment)...");
  });

  it("generates changelog only from commits after the remote tag, not full history", async () => {
    const dir = tempRepoWithRemoteOnlyTags();
    const { exitCode, stdout } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Unreleased");
    expect(stdout).toMatch(/feat/i);
    expect(stdout).not.toContain("initial release");
  });

  it("does not crash when repo has no remote configured", async () => {
    const dir = tempReleaseRepo();
    const { exitCode } = await run(["changelog"], dir);

    expect(exitCode).toBe(0);
  });
});
